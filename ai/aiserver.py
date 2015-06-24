import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

import unicodedata
from flask import Flask, request, json
from flask.ext.cors import cross_origin
from pymongo import MongoClient
from gensim import corpora, models, similarities, utils, matutils
from sklearn import svm
app = Flask(__name__)
app.debug = True
client = MongoClient()
db = client.jobsorter

try:
  dict = corpora.Dictionary.load('data/dict')
except:
  dict = ""
print(dict)
try:
  corpus = corpora.MmCorpus('data/corpus')
except:
  corpus = ""
print(corpus)
try:
  ldamodel = models.LdaMulticore.load('data/ldamodel')
except:
  ldamodel = ""
# print(ldamodel)
try:
  ldaindex = similarities.MatrixSimilarity.load('data/ldaindex')
except:
  ldaindex = ""
print(ldaindex)
try:
  bowindex = similarities.MatrixSimilarity.load('data/bowindex')
except:
  bowindex = ""
print(bowindex)
try:
  tfidf = models.TfidfModel.load('data/tfidf')
except:
  tfidf = ""
print(tfidf)
try:
  lsimodel = models.LsiModel.load('data/lsimodel')
except:
  lsimodel = ""
print(lsimodel)

id2jobid = {}
jobid2id = {}
def loadJobidHash():
  global id2jobid,jobid2id
  i = 0
  for line in open('data/jobids'):
    id2jobid[i] = line.rstrip()
    jobid2id[line.rstrip()] = i
    i += 1

try:
  loadJobidHash()
  print("loaded jobidhashes")
except:
  print("trouble loading jobidhash. maybe re-preprocess")

def prepareJobsFromJobids(jobids,useremail):
  # grab database entries for the row numbers
  jobslistwithdata = {row['jobid']: row for row in db.joblistings.find({'jobid': {'$in': jobids}})}
  # remove _id column from results because it messes up the json
  for key in jobslistwithdata:
    del jobslistwithdata[key]['_id']
  # look up reviews based on passed in email
  jobreviewdict = {}
  if (useremail != None):
    jobreviewlist = list(db.reviews.find({'useremail': useremail, 'jobid': {'$in': jobids}}))
    jobreviewdict = {a['jobid']: a['rating'] for a in jobreviewlist}
    airatings = ratejobs(jobids, useremail)
  else:
    airatings = {jobid:-1 for jobid in jobids}
  # combine similarity scores, reviews, aireviews, and jobdetails in finallist
  finallist = []
  for jobid in jobids:
    if (jobid not in jobreviewdict):
      jobreviewdict[jobid] = -1
    finallist.append({'job': jobslistwithdata[jobid], 'rating': jobreviewdict[jobid], 'airating': airatings[jobid]})
  return finallist


def joblistFromSimilarities(simscores, numdocs, useremail):
  global id2jobid
  # sort by score and limit to numdocs
  nearest = sorted([[i,x] for i,x in enumerate(simscores)], key=lambda a: -a[1])[:20]
  # translate the row numbers into jobids
  jobidpairs = [[id2jobid[a[0]], a[1]] for a in nearest] #if id2jobid[a[0]] != jobid]
  # prepare job list from jobids
  results = prepareJobsFromJobids([pair[0] for pair in jobidpairs], useremail)
  for i in range(len(results)):
    results[i]['similarity'] = str(jobidpairs[i][1])
  return results


  # # grab database entries for the row numbers
  # jobslistwithdata = {row['jobid']: row for row in db.joblistings.find({'jobid': {'$in': [a[0] for a in jobidpairs]}})}
  # # remove _id column from results because it messes up the json
  # for key in jobslistwithdata:
  #   del jobslistwithdata[key]['_id']
  # # look up reviews based on passed in email
  # jobreviewdict = {}
  # if (useremail != None):
  #   jobreviewlist = list(db.reviews.find({'useremail': useremail, 'jobid': {'$in': [a[0] for a in jobidpairs]}}))
  #   jobreviewdict = {a['jobid']: a['rating'] for a in jobreviewlist}
  #   airatings = ratejobs([a[0] for a in jobidpairs], useremail)
  # else:
  #   airatings = {pair[0]:-1 for pair in jobidpairs}
  # # combine similarity scores, reviews, aireviews, and jobdetails in finallist
  # finallist = []
  # for pair in jobidpairs:
  #   if (pair[0] not in jobreviewdict):
  #     jobreviewdict[pair[0]] = -1
  #   finallist.append({'job': jobslistwithdata[pair[0]], 'similarity': str(pair[1]), 'rating': jobreviewdict[pair[0]], 'airating': airatings[pair[0]]})
  # return finallist

# returns dictionary of jobids->airatings
def ratejobs(jobs,useremail):
  global dict,corpus,tfidf,lsimodel,jobid2id,id2jobid
  reviews = list(db.reviews.find({'useremail': useremail}))
  labels = []
  reviewrowids = []
  # check for 0 reviews
  if len(reviews) == 0:
    return {jobid:-1 for jobid in jobs}
  else:
    for review in reviews:
      if review['jobid'] in jobid2id:
        labels.append(float(review['rating']))
        reviewrowids.append(jobid2id[review['jobid']])

    samples = [lsimodel[tfidf[corpus[rowid]]] for rowid in reviewrowids]
    # can be linear, rbf with gamma, or poly with degree
    svmmodel = svm.SVR(kernel='rbf', C=1e3, gamma=0.01)

    # train our svm with the labeled data
    svmmodel.fit([matutils.sparse2full(sample,300) for sample in samples],labels)

    # now run the svm model over the jobs to find a rating for each job
    airatings = {}
    for jobid in jobs:
      if jobid in jobid2id:
        airatings[jobid] = (svmmodel.predict([matutils.sparse2full(lsimodel[tfidf[corpus[jobid2id[jobid]]]],300)])).item(0)
      else:
        airatings[jobid] = -1

    return airatings


def preprocessjob(job):
  return utils.simple_preprocess(unicodedata.normalize('NFKC',job['title'] + " " + job['job_detail']).encode('ascii','ignore'))

@app.route("/preprocess", methods=['POST'])
def preprocesscreate():
  myidfile = open('data/jobids','w')
  mydatafile = open('data/preprocess', 'w')
  for job in db.joblistings.find({},{'title':1,'job_detail':1,'jobid':1}):
    myidfile.write("%s\n" % job['jobid'])
    mydatafile.write("%s\n" % " ".join(preprocessjob(job)))
  myidfile.close()
  mydatafile.close()
  loadJobidHash()
  return 'preprocessed data created'


@app.route("/dict", methods=['POST'])
def dictcreate():
  global dict
  dict = corpora.Dictionary(line.split() for line in open('data/preprocess'))
  dict.filter_extremes(no_below = 3, no_above = 0.7, keep_n = None)
  dict.save('data/dict')
  return 'dict created'

@app.route("/corpus", methods=['POST'])
def corpuscreate():
  global dict,corpus
  generator = (dict.doc2bow(line.split()) for line in open('data/preprocess'))
  corpora.MmCorpus.serialize('data/corpus', generator)
  return "created corpus"
  # if request.form['testvar']:
  #   return request.form['testvar']
  # else:
  #   return 'nothin'

@app.route("/tfidf", methods=['POST'])
def tfidfcreate():
  global corpus,tfidf
  tfidf = models.TfidfModel(corpus)
  tfidf.save('data/tfidf')
  return 'tfidf corpus created'

@app.route("/lsimodel", methods=['POST'])
def lsimodelcreate():
  global dict,corpus,tfidf,lsimodel
  lsimodel = models.LsiModel(tfidf[corpus], id2word=dict, num_topics=300)
  lsimodel.save('data/lsimodel')
  return 'lsi model created'

@app.route("/ldamodel", methods=['POST'])
def ldamodelcreate():
  global dict,corpus,ldamodel
  ldamodel = models.LdaMulticore(corpus, num_topics=300, id2word=dict, workers=12, passes=30, iterations=100)
  ldamodel.save('data/ldamodel')
  return 'lda model created'

@app.route("/ldaindex", methods=['POST'])
def ldaindexcreate():
  global corpus,ldamodel,ldaindex
  ldaindex = similarities.MatrixSimilarity([ldamodel[doc] for doc in corpus], num_features = ldamodel.num_topics)
  ldaindex.save('data/ldaindex')
  return 'lda index created'

@app.route("/bowindex", methods=['POST'])
def bowindexcreate():
  global corpus,bowindex
  bowindex = similarities.MatrixSimilarity(corpus)
  bowindex.save('data/bowindex')
  return 'bow index created'

@app.route("/lsiindex", methods=['POST'])
def lsiindexcreate():
  global corpus,tfidf,lsiindex,lsimodel
  lsiindex = similarities.MatrixSimilarity(lsimodel[tfidf[corpus]])
  lsiindex.save('data/lsiindex')
  return 'lsi index created'

@app.route("/lsisimilar")
@cross_origin()
def lsisimilar():
  global dict,corpus,tfidf,lsiindex,jobid2id,id2jobid
  jobid = request.args.get('j')
  useremail = request.args.get('user')
  if (jobid != None):
    # test if jobid is in our corpus
    if jobid in jobid2id:
      # get similarity scores for all docs in the corpus
      similardocs = lsiindex[tfidf[corpus[jobid2id[jobid]]]]
      # turn scores into job pages with ratings
      results = joblistFromSimilarities(similardocs, 20, useremail)
      return json.jsonify({'results': results})
    else:
      return 'job '+jobid+' not found in our corpus. maybe the corpus is out of date.'
  else:
    return "pass in a jobid with ?j="

@app.route("/bowsimilar")
@cross_origin()
def bowsimilar():
  global dict,corpus,bowindex,jobid2id,id2jobid
  jobid = request.args.get('j')
  useremail = request.args.get('user')
  if (jobid != None):
    # test if jobid is in our corpus
    if jobid in jobid2id:
      # get similarity scores for all docs in the corpus
      similardocs = bowindex[corpus[jobid2id[jobid]]]
      # turn scores into job pages with ratings
      results = joblistFromSimilarities(similardocs, 20, useremail)
      return json.jsonify({'results': results})
    else:
      return 'job '+jobid+' not found in our corpus. maybe the corpus is out of date.'
  else:
    return "pass in a jobid with ?j="

@app.route("/ldasimilar")
@cross_origin()
def ldasimilar():
  global dict,corpus,ldamodel,ldaindex,jobid2id,id2jobid
  jobid = request.args.get('j')
  useremail = request.args.get('user')
  if (jobid != None):
    if (jobid in jobid2id):
      # convert jobid into corpus rownumber
      jobnum = jobid2id[jobid]
      # grab similarity scores from our lda index
      similardocs = ldaindex[ldamodel[corpus[jobnum]]]
      # turn scores into job pages with ratings
      results = joblistFromSimilarities(similardocs, 20, useremail)
      return json.jsonify({'results': results})
    else:
      return 'job '+jobid+' not found in our corpus. maybe the corpus is out of date.'
  else:
    return "pass in a jobid with ?j="

@app.route("/mongosearch")
@cross_origin()
def mongosearch():
  query = request.args.get('q')
  useremail = request.args.get('user')
  if query:
    jobs = list(db.joblistings.find({ '$text': { '$search': query } }, { 'score': { '$meta': "textScore" }, 'jobid':1 }).sort( [( 'score', { '$meta': "textScore" })] ).limit(10))
  else:
    jobs = list(db.joblistings.find({},{'jobid':1}).limit(10))
  jobids = [job['jobid'] for job in jobs]
  # print useremail
  results = prepareJobsFromJobids(jobids, useremail)
  return json.jsonify({'results': results})
  # return 'hi'
  #cursor = db.collection('joblistings').find( { $text: { $search: query } }, { score: { $meta: "textScore" } }).sort( { score: { $meta: "textScore" } } ).limit(10);

@app.route("/main")
def main():
  return """<html><head></head><body>
  <form method='POST' action='preprocess'>
    <button>create preprocessed data</button>
  </form>
  <form method='POST' action='dict'>
    <button>create dict</button>
  </form>
  <form method='POST' action='corpus'>
    <button>create corpus</button>
  </form>
  <form method='POST' action='ldamodel'>
    <button>create lda model</button>
  </form>
  <form method='POST' action='ldaindex'>
    <button>create lda index</button>
  </form>
  <form method='POST' action='bowindex'>
    <button>create bow index</button>
  </form>
  <form method='POST' action='tfidf'>
    <button>create tfidf corpus</button>
  </form>
  <form method='POST' action='lsimodel'>
    <button>create lsi model</button>
  </form>
  <form method='POST' action='lsiindex'>
    <button>create lsi index</button>
  </form>
  </body></html>"""

if __name__ == "__main__":
  app.run(host='0.0.0.0')
