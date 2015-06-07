import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

dict = corpora.Dictionary.load('tmp/dict')
corpus = corpora.MmCorpus('tmp/corpus')

model = models.LdaMulticore(corpus, num_topics=100, id2word=dict, workers=3, passes=10, iterations=100)
model.save('tmp/lda')