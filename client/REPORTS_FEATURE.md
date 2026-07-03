# Ocean Hazard Reports Feature

## Overview

The Reports feature provides a comprehensive visualization of ocean hazard reports across coastal areas. Users can view real-time heatmaps showing the density of reported incidents, along with detailed statistics and analytics.

## Features

### 📊 Interactive Heatmap
- **Real-time Data**: Displays ocean hazard reports from the database
- **Geographic Visualization**: Uses Leaflet maps with heat layer overlays
- **Intensity Mapping**: Color-coded intensity based on report density
- **Interactive Controls**: Click to explore specific locations

### 📈 Statistics Dashboard
- **Total Reports**: Overall count of submitted reports
- **Verification Status**: Breakdown of verified vs pending reports
- **Sentiment Analysis**: Average sentiment score across reports
- **Category Distribution**: Breakdown by hazard type

### 🗺️ Map Features
- **Coastal Focus**: Centered on Indian coastal regions
- **Zoom Controls**: Interactive zoom and pan functionality
- **Heat Layer**: Visual representation of report density
- **Responsive Design**: Works on desktop and mobile devices

## Technical Implementation

### API Integration
- **Heatmap Data**: `/reports/heatmap` endpoint
- **Statistics**: `/reports/stats` endpoint
- **Real-time Updates**: Automatic data refresh capabilities

### Components
- `OceanHazardHeatmap.js`: Main heatmap visualization component
- `api.js`: API service for server communication
- `page.js`: Reports page with statistics and layout

### Dependencies
- **Google Maps API**: High-quality satellite imagery and mapping
- **@googlemaps/js-api-loader**: Google Maps JavaScript API loader
- **React**: Component framework
- **Next.js**: Server-side rendering and routing

## Usage

### Accessing the Reports Page
1. Navigate to `/reports` in the application
2. View the interactive heatmap and statistics
3. Use the refresh button to update data
4. Click on map areas to explore specific locations

### Data Sources
- **Primary**: Real-time data from the Tarang server API
- **Fallback**: Demo data when API is unavailable
- **Mock Data**: Sample data for development and testing

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### API Endpoints
- `GET /reports/heatmap` - Heatmap data with filters
- `GET /reports/stats` - Report statistics
- `GET /reports` - List of reports with pagination

### Map Configuration
- **Center**: India (20.5937, 78.9629)
- **Zoom Level**: 5 (country view)
- **Map Type**: Hybrid (satellite with labels)
- **Heat Radius**: 30px
- **Heat Opacity**: 0.8
- **Custom Styling**: Dark water and landscape for better heatmap visibility

## Future Enhancements

### Planned Features
- **Time-based Filtering**: Filter reports by date range
- **Category Filtering**: Filter by hazard type
- **Export Functionality**: Download heatmap data
- **Real-time Updates**: WebSocket integration
- **Mobile Optimization**: Enhanced mobile experience

### Performance Optimizations
- **Data Caching**: Implement client-side caching
- **Lazy Loading**: Load map data on demand
- **Compression**: Optimize data transfer
- **CDN Integration**: Serve static assets from CDN

## Troubleshooting

### Common Issues
1. **Map Not Loading**: Check Leaflet CSS imports
2. **API Errors**: Verify server connectivity
3. **Performance**: Reduce data points for better performance
4. **Mobile Issues**: Test on various screen sizes

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'reports:*');
```

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Access reports page: `http://localhost:3000/reports`

### Code Style
- Use ESLint configuration
- Follow React best practices
- Implement proper error handling
- Add comprehensive comments

## License

This feature is part of the Tarang project and follows the same licensing terms.
