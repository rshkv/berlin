import json
import functools as ft
import pandas as pd


def translation(name):
    def decorator(f):
        f.translation = name
        return f
    return decorator


def has_relative(f):
    f.has_relative = True
    return f


class PopulationStats:

    @classmethod
    def _read_csv(cls, path):
        df = pd.read_csv(path, encoding='iso8859', sep=';')
        df = df.drop(['Bezirk', 'Ortsteil'], axis=1)
        df = df.set_index(['Ortst-Name'])
        return df

    def __init__(self, path):
        self.df = self._read_csv(path)

    @translation('Einwohner')
    def population(self, df=None, relative=False):
        if df is None:
            df = self.df
        total = df.groupby(level=0)['Häufigkeit'].sum()
        if not relative:
            return total
        return total / self.population()

    @has_relative
    @translation('Frauen')
    def females(self, rel=False):
        return self.population(self.df[self.df['Geschl'] == 2], rel)

    @has_relative
    @translation('Männer')
    def males(self, rel=False):
        return self.population(self.df[self.df['Geschl'] == 1], rel)

    @has_relative
    @translation('Ausländer')
    def foreigners(self, rel=False):
        return self.population(self.df[self.df['Staatsangeh'] == 'A'], rel)

    @has_relative
    @translation('Deutsche')
    def translations(self, rel=False):
        return self.population(self.df[self.df['Staatsangeh'] == 'D'], rel)

    @translation('Bezirk')
    def district_names(self):
        return self.df.groupby(level=0)['Bez-Name'].first()

    def __iter__(self):
        for attr in dir(self):
            f = getattr(self, attr)
            if attr.startswith('_') or not callable(f):
                continue
            yield f.translation, f

            if getattr(f, 'has_relative', False):
                yield f.translation + ' (relativ)', ft.partial(f, rel=True)


class GeoJSON:

    def __init__(self, geojson, index):
        self.data = json.load(open(geojson))
        self.features = {f['properties'][index]: f['properties']
                         for f in self.data['features']}
        self.drop('Description')

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

if __name__ == '__main__':
    berlin = GeoJSON('data/Berlin-Ortsteile.geojson')
    berlin['Mitte']['Description'] = 2
    print(berlin.data['features'][0]['properties'])
