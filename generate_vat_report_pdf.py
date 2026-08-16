#!/usr/bin/env python3
"""
Generate Saudi VAT Audit Report PDF - Matching exact design
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER

def create_vat_report_pdf():
    doc = SimpleDocTemplate(
        "vat_report.pdf",
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    styles = getSampleStyleSheet()
    
    # Colors
    TEAL = colors.HexColor('#0F6E56')
    TEAL_LIGHT = colors.HexColor('#F0FAF6')
    ORANGE = colors.HexColor('#EF9F27')
    RED = colors.HexColor('#D85A30')
    GREEN = colors.HexColor('#1D9E75')
    GRAY = colors.HexColor('#888888')
    WHITE = colors.HexColor('#FFFFFF')
    LIGHT_GRAY = colors.HexColor('#F5F5F5')
    DARK = colors.HexColor('#333333')
    
    # Styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, alignment=TA_CENTER, 
                                   spaceAfter=4, textColor=TEAL, fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER, 
                                     spaceAfter=8, textColor=GRAY)
    section_title_style = ParagraphStyle('SectionTitle', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER,
                                          spaceAfter=4, textColor=TEAL, fontName='Helvetica-Bold')
    
    elements = []
    
    # Title
    elements.append(Paragraph("SAUDI VAT AUDIT REPORT", title_style))
    elements.append(Paragraph("Period: This Month", subtitle_style))
    
    # VAT Summary Box
    elements.append(Paragraph("📊 VAT Summary (Saudi Arabia - 15%)", section_title_style))
    
    vat_data = [
        ['Output VAT', 'Input VAT', 'VAT Payable'],
        ['₮7.50', '₮30.00', '₮22.50']
    ]
    vat_table = Table(vat_data, colWidths=[50*mm, 50*mm, 50*mm])
    vat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ('BOX', (0, 0), (-1, -1), 2, TEAL),
    ]))
    elements.append(vat_table)
    elements.append(Spacer(1, 6*mm))
    
    # Income & Expense Summary (Side by Side)
    elements.append(Paragraph("Income Summary", section_title_style))
    
    summary_data = [
        ['Income Summary', 'Expense Summary'],
        ['──────────────────────', '─────────────────────────'],
        ['Sales: ₮50.00', 'Purchase: ₮200.00'],
        ['VAT: ₮7.50', 'VAT: ₮30.00'],
        ['Manual: ₮10.00', 'Manual: ₮0.00'],
        ['──────────────────────', '─────────────────────────'],
        ['TOTAL: ₮67.50', 'TOTAL: ₮230.00'],
    ]
    
    summary_table = Table(summary_data, colWidths=[70*mm, 70*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
        ('TEXTCOLOR', (0, 1), (-1, 1), GRAY),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (0, -1), TEAL),
        ('TEXTCOLOR', (1, -1), (1, -1), RED),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, TEAL),
        ('LINEABOVE', (1, -1), (1, -1), 1.5, RED),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ('LINEBEFORE', (1, 0), (1, -1), 1, colors.HexColor('#cccccc')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 6*mm))
    
    # Net Loss Box
    net_loss_data = [['Net Loss: ₮-162.50']]
    net_loss_table = Table(net_loss_data, colWidths=[140*mm])
    net_loss_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff3cd')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#856404')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#856404')),
    ]))
    elements.append(net_loss_table)
    elements.append(Spacer(1, 8*mm))
    
    # Sales Transactions Table
    elements.append(Paragraph("📄 Sales Transactions Table", section_title_style))
    sales_data = [
        ['#', 'Invoice ID', 'Time', 'Items', 'Base (excl.VAT)', 'VAT', 'Total (incl.VAT)', 'Paid', 'Balance'],
        ['1', '2608157712131', '14:14', '1', '₮50.00', '₮7.50', '₮57.50', '₮57.50', '₮0.00'],
        ['TOTAL', '', '', '', '₮50.00', '₮7.50', '₮57.50', '', ''],
    ]
    sales_table = Table(sales_data, colWidths=[15*mm, 35*mm, 20*mm, 15*mm, 30*mm, 25*mm, 35*mm, 25*mm, 25*mm])
    sales_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8F5F3')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('TEXTCOLOR', (5, 1), (5, -1), ORANGE),
        ('TEXTCOLOR', (0, -1), (-1, -1), TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (0, 0), (-1, -1), 1, TEAL),
    ]))
    elements.append(sales_table)
    elements.append(Spacer(1, 6*mm))
    
    # Purchase Transactions Table
    elements.append(Paragraph("📄 Purchase Transactions Table", section_title_style))
    purchase_data = [
        ['#', 'Purchase ID', 'Time', 'Supplier', 'Items', 'Base (excl.VAT)', 'VAT', 'Total (incl.VAT)'],
        ['1', '2608157779963', '14:13', 'Al-Marwa Trading', '1', '₮40.00', '₮6.00', '₮46.00'],
        ['2', '2608151875557', '14:13', 'Suzan Beverages', '2', '₮80.00', '₮12.00', '₮92.00'],
        ['3', '2608151082756', '14:13', 'Mini Food', '2', '₮80.00', '₮12.00', '₮92.00'],
        ['TOTAL', '', '', '', '', '₮200.00', '₮30.00', '₮230.00'],
    ]
    purchase_table = Table(purchase_data, colWidths=[15*mm, 35*mm, 20*mm, 40*mm, 15*mm, 35*mm, 25*mm, 35*mm])
    purchase_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8F5F3')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('TEXTCOLOR', (6, 1), (6, -1), ORANGE),
        ('TEXTCOLOR', (0, -1), (-1, -1), TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (0, 0), (-1, -1), 1, TEAL),
    ]))
    elements.append(purchase_table)
    elements.append(Spacer(1, 6*mm))
    
    # Manual Income Table
    elements.append(Paragraph("📄 Manual Income Table", section_title_style))
    manual_income_data = [
        ['#', 'Date', 'Time', 'Description', 'Amount', 'VAT'],
        ['1', '-', '-', 'BILL', '₮10.00', 'No VAT'],
        ['TOTAL', '', '', '', '₮10.00', '₮0.00'],
    ]
    manual_income_table = Table(manual_income_data, colWidths=[20*mm, 30*mm, 25*mm, 50*mm, 35*mm, 30*mm])
    manual_income_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8F5F3')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (0, -1), (-1, -1), TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (0, 0), (-1, -1), 1, TEAL),
    ]))
    elements.append(manual_income_table)
    elements.append(Spacer(1, 6*mm))
    
    # Manual Expenses Table
    elements.append(Paragraph("📄 Manual Expenses Table", section_title_style))
    manual_expense_data = [
        ['#', 'Date', 'Time', 'Description', 'Amount', 'VAT'],
        ['No manual expenses for this period.', '', '', '', '', ''],
    ]
    manual_expense_table = Table(manual_expense_data, colWidths=[20*mm, 30*mm, 25*mm, 50*mm, 35*mm, 30*mm])
    manual_expense_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('SPAN', (0, 1), (-1, 1)),
        ('TEXTCOLOR', (0, 1), (-1, 1), GRAY),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (0, 0), (-1, -1), 1, TEAL),
    ]))
    elements.append(manual_expense_table)
    
    # Build PDF
    doc.build(elements)
    print("✅ PDF created successfully: vat_report.pdf")

if __name__ == "__main__":
    create_vat_report_pdf()
