import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Style, Fill } from 'ol/style';
import { Frame, GeoJSON, FeatureGeojson } from '../types';

const percentageToHsl = (percentage: number) => {
  const hue = percentage * -120 + 120;
  return 'hsla(' + hue + ', 100%, 50%, 0.45)';
};

const createPolygon = (feature: FeatureGeojson, value: string, color: string) => {
  let coordinates: number[][][] = [];
  if (feature.geometry.type == 'Polygon') {
    coordinates = feature.geometry.coordinates;
  } else if (feature.geometry.type == 'LineString') {
    // @ts-ignore
    coordinates = [feature.geometry.coordinates];
  }
  const polygonFeature = new Feature({
    type: 'Polygon',
    geometry: new Polygon(coordinates).transform('EPSG:4326', 'EPSG:3857'),
  });
  polygonFeature.set('value', value);
  polygonFeature.set('color', color);
  polygonFeature.setStyle(
    new Style({
      fill: new Fill({
        color: color,
      }),
    })
  );
  return polygonFeature;
};

export const createHeatLayer = (series: Frame[], geojson: GeoJSON) => {
  const assignValueToStore: { [key: string]: number } = {};
  const assignValueToStoreLog: { [key: string]: number } = {};

  series.map(item => {
    const sumValue = item.fields[0].values.buffer.slice(-1)[0] || 0;
    if (item.name) {
      assignValueToStore[item.name] = sumValue;
      assignValueToStoreLog[item.name] = Math.log2(sumValue + 1);
    }
  });

  const heatValues = Object.values(assignValueToStoreLog);
  const max = Math.max(...heatValues);
  const min = Math.min(...heatValues);
  const range = max - min;

  const polygons: Feature[] = [];

  geojson.features.map(feature => {
    if (feature.properties && feature.properties.name /* && stores.includes(feature.properties.id) */) {
      if (assignValueToStore[feature.properties.name]) {
        const percentage = range != 0 ? (assignValueToStoreLog[feature.properties.name] - min) / range : 0;
        polygons.push(
          createPolygon(feature, assignValueToStore[feature.properties.name].toFixed(3), percentageToHsl(percentage))
        );
      } else {
        polygons.push(createPolygon(feature, '', 'rgba(125, 126, 126, 0.2)'));
      }
      // const valueLabel = assignValueToStore[feature.properties.id] || 0;
      // let percentage = 0;
      // if (assignValueToStoreLog[feature.properties.id] && range != 0) {
      //   percentage = (assignValueToStoreLog[feature.properties.id] - min) / range;
      // }
      // polygons.push(createPolygon(feature, valueLabel.toFixed(3), percentageToHsl(percentage)));
    }
  });

  return new VectorLayer({
    source: new VectorSource({
      features: polygons,
    }),
    zIndex: 2,
  });
};
