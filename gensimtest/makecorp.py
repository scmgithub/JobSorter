import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

stoplist = set([line.strip() for line in open('stopwords_english')])
import pymongo

from pymongo import MongoClient
client = MongoClient()
db = client.jobsorter

dict = corpora.Dictionary((utils.simple_preprocess(job['job_detail']) for job in db.joblistings.find()), 100000)
stop_ids = [dict.token2id[stopword] for stopword in stoplist if stopword in dict.token2id]
once_ids = [tokenid for tokenid, docfreq in dict.dfs.iteritems() if docfreq == 1]
dict.filter_tokens(stop_ids + once_ids)
dict.compactify()

class MyCorpus(object):
  def __iter__(self):
    for job in db.joblistings.find():
      yield dict.doc2bow(utils.simple_preprocess(job['job_detail']))

corpora.MmCorpus.serialize('tmp/corpus.mm',MyCorpus())
dict.save('tmp/mydict.dict')
print(dict)
