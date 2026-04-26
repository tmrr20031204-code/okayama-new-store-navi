'use server'

import { google } from 'googleapis';
import { getAuthClient, getSpreadsheetId } from '@/lib/googleSheets';
import { revalidatePath } from 'next/cache';

export async function updateStoreStatus(rowIndex: number, newStatus: string) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = await getSpreadsheetId();

    if (!spreadsheetId) throw new Error('Spreadsheet not found');

    // F列（ステータス）の該当行を更新
    const range = `F${rowIndex}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newStatus]]
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
