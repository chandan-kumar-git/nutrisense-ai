"""
NutriSense AI · IDP P020: custom estimators shared by training and inference.
"""

import numpy as np

from .common import status_of


class ShareThenThreshold:
    """Regress next week's share of RDA, then apply the app's thresholds.

    The 3-day average is a noisy estimate of a person's usual intake; a regressor
    learns how much to trust it versus their profile and eating pattern.
    """

    def __init__(self, regressor, thresholds):
        self.regressor = regressor
        self.thresholds = thresholds

    def fit(self, X, Y_share):
        self.regressor.fit(X, Y_share)
        return self

    def predict_share(self, X):
        return np.clip(self.regressor.predict(X), 0, None)

    def predict(self, X):
        S = self.predict_share(X)
        return np.vectorize(lambda v: status_of(v, self.thresholds))(S)
