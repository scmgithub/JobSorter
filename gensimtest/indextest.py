import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

# dict = corpora.Dictionary.load('tmp/dict')
corpus = corpora.MmCorpus('tmp/corpus')

model = models.LdaMulticore.load('tmp/lda')

# index = similarities.MatrixSimilarity([model[doc] for doc in corpus],num_features = model.num_topics)
# index.save()
# print index[corpus[0]]

index = similarities.MatrixSimilarity.load('tmp/myindex')

# print index[0]

z = 0
for s in index:
  print str(z) + " " + str(sorted([[i,x] for i,x in enumerate(s)], key=lambda a: -a[1])[:10])
  z += 1