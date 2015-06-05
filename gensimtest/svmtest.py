from sklearn import svm, datasets

from sklearn import datasets
iris = datasets.load_iris()
digits = datasets.load_digits()
print(digits.data.size)