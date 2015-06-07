import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils
import pymongo

from pymongo import MongoClient
client = MongoClient()
db = client.jobsorter


dict = corpora.Dictionary( utils.simple_preprocess(job['title'] + " " + job['job_detail']) for job in db.joblistings.find({},{'title':1,'job_detail':1}) )

# remove most common and least common words here
# remove any rare words that exist in only no_below docs
# remove any common words that exist in at least no_above percentage of docs
dict.filter_extremes(no_below = 3, no_above = 0.7, keep_n = None)


dict.save('tmp/dict')
