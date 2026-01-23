// Google Sheets Integration Service
// Connected via Replit Google Sheets connector

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface SheetColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: any[];
}

export interface SheetData {
  columns: SheetColumn[];
  rows: Record<string, any>[];
  totalRows: number;
  sheetName: string;
}

function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmptyValues.length === 0) return 'string';

  let numberCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const val of nonEmptyValues.slice(0, 10)) {
    const strVal = String(val).trim().toLowerCase();
    
    if (strVal === 'true' || strVal === 'false' || strVal === 'ya' || strVal === 'tidak') {
      boolCount++;
    } else if (!isNaN(Number(val)) && strVal !== '') {
      numberCount++;
    } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(strVal) || /^\d{4}-\d{2}-\d{2}/.test(strVal)) {
      dateCount++;
    }
  }

  const threshold = nonEmptyValues.slice(0, 10).length * 0.7;
  if (numberCount >= threshold) return 'number';
  if (dateCount >= threshold) return 'date';
  if (boolCount >= threshold) return 'boolean';
  return 'string';
}

export async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  range?: string
): Promise<SheetData> {
  const sheets = await getUncachableGoogleSheetClient();
  
  const fullRange = range ? `${sheetName}!${range}` : sheetName;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
  });

  const values = response.data.values || [];
  
  if (values.length === 0) {
    return { columns: [], rows: [], totalRows: 0, sheetName };
  }

  const headers = values[0] as string[];
  const dataRows = values.slice(1);

  const columns: SheetColumn[] = headers.map((header, index) => {
    const columnValues = dataRows.map(row => row[index]);
    return {
      name: header,
      type: detectColumnType(columnValues),
      sampleValues: columnValues.slice(0, 5)
    };
  });

  const rows = dataRows.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let value = row[index] ?? '';
      const colType = columns[index]?.type;
      
      if (colType === 'number' && value !== '') {
        value = Number(value);
      } else if (colType === 'boolean') {
        const strVal = String(value).toLowerCase();
        value = strVal === 'true' || strVal === 'ya';
      }
      
      obj[header] = value;
    });
    return obj;
  });

  return {
    columns,
    rows,
    totalRows: rows.length,
    sheetName
  };
}

export async function listSpreadsheetSheets(spreadsheetId: string): Promise<string[]> {
  const sheets = await getUncachableGoogleSheetClient();
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return response.data.sheets?.map(sheet => sheet.properties?.title || '') || [];
}

export async function getSpreadsheetMetadata(spreadsheetId: string) {
  const sheets = await getUncachableGoogleSheetClient();
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return {
    title: response.data.properties?.title,
    sheets: response.data.sheets?.map(sheet => ({
      name: sheet.properties?.title,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount
    }))
  };
}

export function generateVisualizationSuggestions(columns: SheetColumn[]): any[] {
  const suggestions: any[] = [];
  
  const numericColumns = columns.filter(c => c.type === 'number');
  const dateColumns = columns.filter(c => c.type === 'date');
  const stringColumns = columns.filter(c => c.type === 'string');

  if (numericColumns.length > 0 && stringColumns.length > 0) {
    suggestions.push({
      type: 'bar',
      title: `${numericColumns[0].name} by ${stringColumns[0].name}`,
      xAxis: stringColumns[0].name,
      yAxis: numericColumns[0].name,
      description: `Bar chart menunjukkan ${numericColumns[0].name} berdasarkan ${stringColumns[0].name}`
    });
  }

  if (numericColumns.length >= 2) {
    suggestions.push({
      type: 'pie',
      title: `Distribusi ${numericColumns[0].name}`,
      dataKey: numericColumns[0].name,
      description: `Pie chart untuk melihat proporsi ${numericColumns[0].name}`
    });
  }

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    suggestions.push({
      type: 'line',
      title: `Trend ${numericColumns[0].name} over Time`,
      xAxis: dateColumns[0].name,
      yAxis: numericColumns[0].name,
      description: `Line chart untuk melihat tren ${numericColumns[0].name} seiring waktu`
    });
  }

  if (stringColumns.length > 0) {
    const categoryCol = stringColumns.find(c => {
      const uniqueValues = new Set(c.sampleValues);
      return uniqueValues.size <= 10;
    });
    
    if (categoryCol) {
      suggestions.push({
        type: 'donut',
        title: `Breakdown by ${categoryCol.name}`,
        dataKey: categoryCol.name,
        description: `Donut chart untuk breakdown berdasarkan ${categoryCol.name}`
      });
    }
  }

  suggestions.push({
    type: 'table',
    title: 'Data Table',
    columns: columns.map(c => c.name),
    description: 'Tabel data lengkap dengan semua kolom'
  });

  return suggestions;
}

export default {
  fetchSheetData,
  listSpreadsheetSheets,
  getSpreadsheetMetadata,
  generateVisualizationSuggestions
};
