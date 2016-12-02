import json
import pandas as pd
import functools as ft
from collections import defaultdict


def translation(name):
    def decorator(f):
        f.translation = name
        return f
    return decorator


class PopulationStats:

    @classmethod
    def _read_csv(cls, path):
        df = pd.read_csv(path, encoding='iso8859', sep=';')
        df = df.drop(['Bezirk', 'Ortsteil'], axis=1)
        return df

    def __init__(self, path):
        self.df = self._read_csv(path)

    @translation('Einwohner')
    def population(self, df=None, relative=False):
        if df is None:
            df = self.df
        total = df.groupby('Ortst-Name')['Häufigkeit'].sum()
        if not relative:
            return total.astype(float)
        return total / self.population()

    @translation('Frauen')
    def females(self, rel=True):
        return self.population(self.df[self.df['Geschl'] == 2], rel)

    @translation('Männer')
    def males(self, rel=True):
        return self.population(self.df[self.df['Geschl'] == 1], rel)

    @translation('Ausländer')
    def foreigners(self, rel=True):
        return self.population(self.df[self.df['Staatsangeh'] == 'A'], rel)

    @translation('Deutsche')
    def translations(self, rel=True):
        return self.population(self.df[self.df['Staatsangeh'] == 'D'], rel)

    @translation('Bezirk')
    def district_names(self):
        return self.df.groupby('Ortst-Name')['Bez-Name'].first()

    @translation('Altersgruppen')
    def age_groups(self):
        return self.df.groupby(['Ortst-Name', 'Altersgr'])['Häufigkeit'].sum() \
            .unstack(level=-1) \
            .fillna(0) \
            .divide(self.population(), axis='index') \
            .rename(columns=lambda c: c.replace('_', ' bis ')) \
            .to_dict(orient='index')

    def __iter__(self):
        for attr in dir(self):
            f = getattr(self, attr)
            if attr.startswith('_') or not callable(f):
                continue
            yield f.translation, f()


class GeoJSON:

    def __init__(self, geojson, index):
        self.data = json.load(open(geojson))
        self.features = {f['properties'][index]: f['properties']
                         for f in self.data['features']}

    def __getitem__(self, key):
        return self.features[key]

    def add(self, key, feature_map):
        for feature, value in feature_map.items():
            self[feature][key] = value

    def drop(self, key):
        for f in self.features.values():
            del f[key]

    def dump(self, path, **dump_args):
        with open(path, 'w') as f:
            json.dump(self.data, f, ensure_ascii=False, **dump_args)

    def names(self):
        return sorted(f['Name'] for f in self.features.values())

    """
        Utilities
    """

    def correct_buckow(self):
        """Buckow consists of two parts and occurs twice in the data."""
        props = self['Buckow']
        for f in self.data['features']:
            if f['properties']['Name'] == 'Buckow':
                f['properties'] = props.copy()

    def merge_age_groups(self):
        new_keys = ['0 bis 10', '10 bis 20', '20 bis 30', '30 bis 40',
                    '40 bis 50', '50 bis 60', '60 bis 70', '70 bis 80',
                    '80 bis 90', '90 und älter']
        old_keys = sorted(self.data['features'][0]['properties']
                          ['Altersgruppen'].keys())

        def merge_feature(f):
            keys = zip(zip(old_keys[::2], old_keys[1::2]), new_keys)
            old_groups = f['properties']['Altersgruppen']
            new_groups = {}
            for (old_1, old_2), new in keys:
                new_groups[new] = old_groups[old_1] + old_groups[old_2]
            return new_groups

        for feature in self.data['features']:
            feature['properties']['Altersgruppen'] = merge_feature(feature)

    def extents(self):
        extents = {}
        for f in self.features.values():
            for k, v in f.items():
                if not type(v) is dict:
                    continue
                if k not in extents:
                    extents[k] = defaultdict(lambda: [float('inf'), float('-inf')])
                for kk, vv in v.items():
                    if extents[k][kk][0] > vv:
                        extents[k][kk][0] = vv  # Min value
                    if extents[k][kk][1] < vv:
                        extents[k][kk][1] = vv  # Max value
        for k in extents.keys():
            extents[k] = dict(extents[k])
        return extents
