import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

# dict = corpora.Dictionary.load('tmp/dict')
corpus = corpora.MmCorpus('tmp/corpus')

model = models.LdaMulticore.load('tmp/lda')

index = similarities.Similarity('tmp/ldaindextemp',(model[doc] for doc in corpus),model.num_topics)
index.save('tmp/ldaindex')
# print index[corpus[0]]