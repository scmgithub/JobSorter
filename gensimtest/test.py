import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

from gensim import corpora, models, similarities, utils
dictionary = corpora.Dictionary.load('tmp/mydict.dict')
corpus = corpora.MmCorpus('tmp/corpus.mm')

query = "Senior Ruby Developer"

lsi = models.LsiModel(corpus, id2word=dictionary, num_topics=4)
vec_bow = dictionary.doc2bow(utils.simple_preprocess(query))
vec_lsi = lsi[vec_bow]
print vec_lsi

index = similarities.MatrixSimilarity(lsi[corpus])
sims = index[vec_lsi]
sortedsims = sorted(enumerate(sims), key=lambda item: -item[1])
print(sortedsims)