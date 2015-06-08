import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

import unicodedata
from flask import Flask, request, json
from flask.ext.cors import cross_origin
from pymongo import MongoClient
from gensim import corpora, models, similarities, utils
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
print(ldamodel)
try:
  ldaindex = similarities.MatrixSimilarity.load('data/ldaindex')
except:
  ldaindex = ""
print(ldaindex)

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

@app.route("/ldamodel", methods=['POST'])
def ldamodelcreate():
  global dict,corpus,ldamodel
  ldamodel = models.LdaMulticore(corpus, num_topics=100, id2word=dict, workers=3, passes=8, iterations=100)
  ldamodel.save('data/ldamodel')
  return 'lda model created'

@app.route("/ldaindex", methods=['POST'])
def ldaindexcreate():
  global corpus,ldamodel,ldaindex
  ldaindex = similarities.MatrixSimilarity([ldamodel[doc] for doc in corpus], num_features = ldamodel.num_topics)
  ldaindex.save('data/ldaindex')
  return 'lda index created'

@app.route("/ldasimilar")
@cross_origin()
def ldasimilar():
  global dict,corpus,ldamodel,ldaindex,jobid2id,id2jobid
  jobid = request.args.get('j')
  useremail = request.args.get('user')
  if (jobid != None):
    try:
      # convert jobid into corpus rownumber
      jobnum = jobid2id[jobid]
      # grab similarity scores from our lda index
      similardocs = ldaindex[ldamodel[corpus[jobnum]]]
      # sort by score and limit to the 20 best matches
      nearest20 = sorted([[i,x] for i,x in enumerate(similardocs)], key=lambda a: -a[1])[:20]
      # translate the row numbers into jobids
      jobidpairs = [[id2jobid[a[0]], a[1]] for a in nearest20] #if id2jobid[a[0]] != jobid]
      # grab database entries for the row numbers
      jobslistwithdata = {row['jobid']: row for row in db.joblistings.find({'jobid': {'$in': [a[0] for a in jobidpairs]}})}
      # remove _id column from results because it messes up the json
      for key in jobslistwithdata:
        del jobslistwithdata[key]['_id']
      # look up reviews based on passed in email
      jobreviewdict = {}
      if (useremail != None):
        jobreviewlist = list(db.reviews.find({'useremail': useremail, 'jobid': {'$in': [a[0] for a in jobidpairs]}}))
        jobreviewdict = {a['jobid']: a['rating'] for a in jobreviewlist}
      # combine similarity scores, reviews, and jobdetails in finallist
      finallist = []
      for pair in jobidpairs:
        if (pair[0] not in jobreviewdict):
          jobreviewdict[pair[0]] = -1
        finallist.append({'job': jobslistwithdata[pair[0]], 'similarity': str(pair[1]), 'rating': jobreviewdict[pair[0]]})
      return json.jsonify({'results': finallist})
    except KeyError:
      return 'no job found in our similarity index'
  else:
    return "pass in a jobid with ?j="

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
  </body></html>"""

if __name__ == "__main__":
  app.run(host='0.0.0.0')
