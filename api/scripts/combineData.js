const fs = require('fs');
const path = require('path');

// Read and parse the CSV files
const objects = fs.readFileSync(path.join(__dirname, '../data/objects.csv'), 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim()) // Remove empty lines
    .map(line => {
        const [id, type, timestamp, metadata] = line.split(',');
        return { id, type, timestamp: parseInt(timestamp), metadata, isEdge: false };
    });

const edges = fs.readFileSync(path.join(__dirname, '../data/edges.csv'), 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim()) // Remove empty lines
    .map(line => {
        const [id1, id2, type, timestamp, properties] = line.split(',');
        return { 
            id: `${id1}-${id2}`, 
            type, 
            timestamp: parseInt(timestamp), 
            metadata: properties,
            isEdge: true,
            source: id1,
            target: id2
        };
    });

// Combine and sort by timestamp
const combined = [...objects, ...edges].sort((a, b) => a.timestamp - b.timestamp);

// Format the output
const output = combined.map(item => {
    if (item.isEdge) {
        return `EDGE: ${item.type} (${item.source} -> ${item.target}) at ${new Date(item.timestamp).toISOString()}`;
    } else {
        return `NODE: ${item.type} (${item.id}) at ${new Date(item.timestamp).toISOString()}`;
    }
}).join('\n');

// Write to file
fs.writeFileSync(path.join(__dirname, '../data/combined.txt'), output);

console.log('Data combined and sorted by timestamp. Output written to combined.txt'); 