import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils
import pymongo

from pymongo import MongoClient
client = MongoClient()
db = client.jobsorter

dict = corpora.Dictionary( utils.simple_preprocess(job['job_detail']) for job in db.joblistings.find({},{'job_detail':1}) )
dict.save('tmp/dict')
