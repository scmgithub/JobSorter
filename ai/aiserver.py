import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from flask import Flask, request, json
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

def preprocessjob(job):
  return utils.simple_preprocess(job['title'] + " " + job['job_detail'])


@app.route("/dict", methods=['POST'])
def dictcreate():
  global dict
  dict = corpora.Dictionary( preprocessjob(job) for job in db.joblistings.find({},{'title':1,'job_detail':1}) )
  dict.filter_extremes(no_below = 3, no_above = 0.7, keep_n = None)
  dict.save('data/dict')
  return 'dict created'

@app.route("/corpus", methods=['POST'])
def corpuscreate():
  global dict,corpus
  generator = (dict.doc2bow(preprocessjob(job)) for job in db.joblistings.find({},{'title':1,'job_detail':1}))
  corpora.MmCorpus.serialize('data/corpus', generator)
  return "created corpus"
  # if request.form['testvar']:
  #   return request.form['testvar']
  # else:
  #   return 'nothin'

@app.route("/ldamodel", methods=['POST'])
def ldamodelcreate():
  global dict,corpus,ldamodel
  ldamodel = models.LdaMulticore(corpus, num_topics=100, id2word=dict, workers=8, passes=4, iterations=100)
  ldamodel.save('data/ldamodel')
  return 'lda model created'

@app.route("/ldaindex", methods=['POST'])
def ldaindexcreate():
  global corpus,ldamodel,ldaindex
  ldaindex = similarities.MatrixSimilarity([ldamodel[doc] for doc in corpus], num_features = ldamodel.num_topics)
  ldaindex.save('data/ldaindex')
  return 'lda index created'

@app.route("/ldasimilar")
def ldasimilar():
  global dict,corpus,ldamodel,ldaindex
  jobid = request.args.get('j')
  if (jobid != None):
    job = db.joblistings.find_one({"jobid": jobid},{'title':1,'job_detail':1})
    if (job != None):
      # return json.jsonify(ldamodel[dict.doc2bow(preprocessjob(job))])
      return json.jsonify(ldaindex[ldamodel[corpus[1]]])
    else:
      return 'no job found'
  else:
    return "pass in a jobid with ?j="

@app.route("/main")
def main():
  return """<html><head></head><body>
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