import { useCallback, useRef, useState } from 'react';
import Map, {  Marker, NavigationControl  } from 'react-map-gl/maplibre';
import { Camera, Eye, MapPin } from 'lucide-react';
import type {MapRef, ViewStateChangeEvent} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY || '';

const MAP_STYLES = {
  streets: `https://tiles.stadiamaps.com/styles/osm_bright.json${STADIA_API_KEY ? `?api_key=${STADIA_API_KEY}` : ''}`,
  outdoors: `https://tiles.stadiamaps.com/styles/outdoors.json${STADIA_API_KEY ? `?api_key=${STADIA_API_KEY}` : ''}`,
  satellite: `https://tiles.stadiamaps.com/styles/alidade_satellite.json${STADIA_API_KEY ? `?api_key=${STADIA_API_KEY}` : ''}`,
};

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  color?: string;
  isCommunity?: boolean;
  photoCount?: number;
  previewUrl?: string;
  hasPublicContent?: boolean;
}

export interface MarkerClickEvent {
  markerId: string;
  position: { x: number; y: number };
}

interface MapViewProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markers?: Array<MapMarker>;
  style?: 'streets' | 'outdoors' | 'satellite';
  interactive?: boolean;
  showNavigation?: boolean;
  onMarkerClick?: (event: MarkerClickEvent) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export const MapView = ({
  latitude = 48.8566,
  longitude = 2.3522,
  zoom = 12,
  markers = [],
  style = 'streets',
  interactive = true,
  showNavigation = true,
  onMarkerClick,
  onMapClick,
  className = '',
}: MapViewProps) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom,
  });

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  }, []);

  const handleClick = useCallback(
    (evt: { lngLat: { lat: number; lng: number } }) => {
      if (onMapClick) {
        onMapClick(evt.lngLat.lat, evt.lngLat.lng);
      }
    },
    [onMapClick],
  );

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onClick={handleClick}
        mapStyle={MAP_STYLES[style]}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
        attributionControl={{ compact: true }}
      >
        {showNavigation && <NavigationControl position="top-right" showCompass showZoom />}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              const rect = (e.originalEvent.target as HTMLElement).getBoundingClientRect();
              onMarkerClick?.({
                markerId: marker.id,
                position: { x: rect.left + rect.width / 2, y: rect.top },
              });
            }}
          >
            {marker.isCommunity ? (
              <div className="cursor-pointer transform hover:scale-110 transition-transform relative" title={marker.label}>
                <div
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md bg-surface/90 backdrop-blur-sm"
                  style={{ borderColor: marker.color || '#9C89B8' }}
                >
                  {marker.previewUrl ? (
                    <img
                      src={marker.previewUrl}
                      alt={marker.label}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Camera size={16} style={{ color: marker.color || '#9C89B8' }} />
                  )}
                </div>
                {marker.photoCount && marker.photoCount > 1 && (
                  <div
                    className="absolute -bottom-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[10px] font-semibold flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: marker.color || '#9C89B8' }}
                  >
                    {marker.photoCount > 99 ? '99+' : marker.photoCount}
                  </div>
                )}
              </div>
            ) : (
              <div className="cursor-pointer transform hover:scale-110 transition-transform relative" title={marker.label}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: marker.color || 'var(--color-primary)' }}
                >
                  <MapPin className="text-white" size={18} />
                </div>
                {marker.hasPublicContent && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center border border-border-light">
                    <Eye size={10} className="text-info" />
                  </div>
                )}
              </div>
            )}
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default MapView;
