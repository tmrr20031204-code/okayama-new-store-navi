'use server'

import { google } from 'googleapis';
import { getAuthClient, getSpreadsheetId } from '@/lib/googleSheets';
import { revalidatePath } from 'next/cache';

export async function updateStoreStatus(rowIndex: number, newStatus: string, details?: { visitorName: string, contactPerson: string, contactInfo: string, notes: string }) {
  try {
    const auth = await getAuthClient();
    if (!auth) throw new Error('Google Auth Client is null');
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = await getSpreadsheetId();

    if (!spreadsheetId) throw new Error('Spreadsheet not found');

    let range = `F${rowIndex}`;
    let values = [[newStatus]];

    if (newStatus === '訪問済み' && details) {
      range = `F${rowIndex}:J${rowIndex}`;
      values = [[newStatus, details.visitorName, details.contactPerson, details.contactInfo, details.notes]];
    } else if (newStatus === '未訪問') {
      // Clear details when reverting to unvisited
      range = `F${rowIndex}:J${rowIndex}`;
      values = [[newStatus, '', '', '', '']];
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });

    // ページデータを再検証して最新状態にする
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
