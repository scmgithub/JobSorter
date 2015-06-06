import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils

# dict = corpora.Dictionary.load('tmp/dict')
# corpus = corpora.MmCorpus('tmp/corpus')

model = models.LdaMulticore.load('tmp/lda')
model.print_topics()