'use client';
// ... existing imports ...
import { useEffect, useState } from 'react';

// Import Leaflet and React-Leaflet components
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// Import leaflet-geometryutil
import 'leaflet-geometryutil'; // Import the plugin

// Fix marker icon issue with Leaflet (Revised)
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define custom icons for start and end markers
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: markerShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: markerShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Merge default options (still needed for other default markers if any)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Define bounds for random coordinate generation (Rough bounds for Turkey)
const TURKEY_BOUNDS = {
    south: 35.5,
    west: 25.5,
    north: 42.0,
    east: 44.8,
};

// Helper function to generate random coordinates within bounds
const generateRandomCoordinate = (bounds: typeof TURKEY_BOUNDS) => {
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    return [lat, lng] as [number, number];
};

// Component to update map view to fit bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // Only fit bounds if there are at least two points
    if (positions.length > 1) { // Need at least two positions to form bounds
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

// Type for Generated Drive Analysis Data (needed for props)
interface GeneratedDriveAnalysisData {
    distance: number;
    driveDuration: { minutes: number; seconds: number };
    tripType: string;
    driveStartTime: Date;
}

interface AnalysisMapProps {
    initialPosition: [number, number] | null; // Receive only the initial start position
    generatedDriveData: GeneratedDriveAnalysisData | null;
}

export default function AnalysisMap({ initialPosition, generatedDriveData }: AnalysisMapProps) {
    // Use internal state for map positions
    const [mapPositions, setMapPositions] = useState<[number, number][]>([]);

    // Calculate end position when initialPosition and generatedDriveData are available
    useEffect(() => {
        if (initialPosition && generatedDriveData) {
            const startLatLng = L.latLng(initialPosition[0], initialPosition[1]);

            // Generate a random bearing (0-360 degrees)
            const randomBearing = Math.random() * 360;

            // Calculate the end point using leaflet-geometryutil
            // @ts-ignore - L.GeometryUtil is added by the plugin
            const endLatLng = L.GeometryUtil.destination(startLatLng, randomBearing, generatedDriveData.distance * 1000); // distance in meters

            const endPos: [number, number] = [endLatLng.lat, endLatLng.lng];

            // Update map positions with both start and end points
            setMapPositions([initialPosition, endPos]);
        }
    }, [initialPosition, generatedDriveData]); // Recalculate when initialPosition or generatedDriveData changes

    // Only render map if we have at least two positions
    if (mapPositions.length < 2) {
        return null; // Don't render map until positions are ready
    }

    return (
        <div className="p-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sürüş Güzergahı</h3>
            {/* Map Container */}
            {/* Center map on the start position initially, FitBounds will adjust later */}
            <MapContainer center={mapPositions[0]} zoom={10} scrollWheelZoom={false} className="w-full h-64 rounded-lg z-0"> 
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Fit map bounds to markers */}
                <FitBounds positions={mapPositions} />

                {/* Start Marker (using green icon) */}
                <Marker position={mapPositions[0]} icon={greenIcon}>
                    {/* Custom icon or tooltip can be added here */}
                </Marker>
                {/* End Marker (using red icon) */}
                <Marker position={mapPositions[1]} icon={redIcon}>
                    {/* Custom icon or tooltip can be added here */}
                </Marker>
                {/* Polyline for displacement */}
                <Polyline positions={mapPositions} color="red" />
            </MapContainer>
            {generatedDriveData && (
                <p className="text-sm text-gray-600 text-center mt-2">
                    Kat edilen mesafe: {generatedDriveData.distance.toFixed(generatedDriveData.distance >= 10 ? 0 : 2)} km ({generatedDriveData.tripType})
                </p>
            )}
        </div>
    );
} 