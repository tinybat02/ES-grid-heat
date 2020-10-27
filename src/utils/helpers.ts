import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Style, Fill } from 'ol/style';
import { Frame, GeoJSON, FeatureGeojson } from '../types';

const percentageToHsl = (percentage: number) => {
  const hue = percentage * -120 + 120;
  return 'hsla(' + hue + ', 100%, 50%, 0.3)';
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
  // const stores: string[] = [];
  const assignValueToStore: { [key: string]: number } = {};

  series.map(item => {
    const sumValue = item.fields[0].values.buffer.slice(-1)[0] || 0;
    if (item.name) {
      // stores.push(item.name);
      assignValueToStore[item.name] = sumValue;
    }
  });

  const polygons: Feature[] = [];

  geojson.features.map(feature => {
    if (feature.properties && feature.properties.id /* && stores.includes(feature.properties.id) */) {
      const percentage = assignValueToStore[feature.properties.id] || 0;
      polygons.push(createPolygon(feature, percentage.toFixed(2), percentageToHsl(percentage)));
    }
  });

  return new VectorLayer({
    source: new VectorSource({
      features: polygons,
    }),
    zIndex: 2,
  });
};
