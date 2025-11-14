// Helper function to convert camelCase store names to display names with spaces
export function formatStoreName(storeName) {
  return storeName.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Helper function to load the YAML config file
export async function loadConfig() {
  try {
    const response = await fetch('/config.yaml');
    const text = await response.text();
    const yaml = require('js-yaml');  // Assuming js-yaml is installed
    return yaml.load(text);
  } catch (error) {
    console.error('Error loading config:', error);
    return { stores: [] };
  }
}