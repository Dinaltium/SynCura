"""
Preprocessing utilities: sliding-window aggregator and normalisation.
"""
import numpy as np
import pandas as pd


def sliding_window(df, window_minutes=60, freq='1min'):
    # df expected to have timestamp index or a 'timestamp' column in seconds
    if 'timestamp' in df.columns:
        df = df.set_index(pd.to_datetime(df['timestamp'], unit='s'))
    df = df.resample(freq).mean().interpolate()
    # rolling window in minutes
    window = f"{window_minutes}min"
    rolled = df.rolling(window=window).mean()
    return rolled


def normalize(df):
    return (df - df.mean()) / (df.std() + 1e-6)


if __name__ == '__main__':
    print('Preprocess utilities loaded')
