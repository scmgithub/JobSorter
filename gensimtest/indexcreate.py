import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

# dict = corpora.Dictionary.load('tmp/dict')
corpus = corpora.MmCorpus('tmp/corpus')

model = models.LdaMulticore.load('tmp/lda')

index = similarities.MatrixSimilarity([model[doc] for doc in corpus], num_features = model.num_topics)
index.save('tmp/myindex')
# print index[corpus[0]]