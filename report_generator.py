import os
import re
import unicodedata
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph as _Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from typing import Dict, Any

def _s(text) -> str:
    """Sanitize text for ReportLab: replace problematic Unicode chars with ASCII equivalents.
    Helvetica (the default ReportLab font) only supports Latin-1, so anything outside
    that range renders as a black rectangle.
    """
    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    # Map common problematic characters
    replacements = {
        "\u2010": "-",  # hyphen
        "\u2011": "-",  # non-breaking hyphen
        "\u2012": "-",  # figure dash
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u2015": "-",  # horizontal bar
        "\u2018": "'",  # left single quote
        "\u2019": "'",  # right single quote
        "\u201A": "'",  # single low quote
        "\u201C": '"',  # left double quote
        "\u201D": '"',  # right double quote
        "\u201E": '"',  # double low quote
        "\u2022": "*",  # bullet
        "\u2023": "*",  # triangular bullet
        "\u2026": "...",  # ellipsis
        "\u2032": "'",  # prime
        "\u2033": '"',  # double prime
        "\u00A0": " ",  # non-breaking space
        "\u2009": " ",  # thin space
        "\u200B": "",   # zero-width space
        "\u200C": "",   # zero-width non-joiner
        "\u200D": "",   # zero-width joiner
        "\uFEFF": "",   # BOM
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    # Final pass: drop any remaining non-Latin-1 characters
    text = text.encode("latin-1", errors="ignore").decode("latin-1")
    return text

def Paragraph(text, *args, **kwargs):
    """Wrapper around ReportLab's Paragraph to automatically sanitize all text."""
    return _Paragraph(_s(text), *args, **kwargs)

class ReportGenerator:
    @staticmethod
    def generate_pdf(project_name: str, analysis: Dict[str, Any], output_path: str) -> str:
        # Create folder if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        doc = SimpleDocTemplate(output_path, pagesize=letter,
                                rightMargin=40, leftMargin=40,
                                topMargin=40, bottomMargin=40)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Define premium color scheme
        PRIMARY_COLOR = colors.HexColor("#6d28d9")   # Violet
        SECONDARY_COLOR = colors.HexColor("#1e1b4b") # Dark Navy
        ACCENT_COLOR = colors.HexColor("#10b981")    # Emerald Green
        LIGHT_BG = colors.HexColor("#f8fafc")        # Slate 50
        BORDER_COLOR = colors.HexColor("#e2e8f0")    # Slate 200
        TEXT_COLOR = colors.HexColor("#334155")      # Slate 700
        
        # Custom styles
        title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=28,
            leading=34,
            textColor=SECONDARY_COLOR,
            spaceAfter=15
        )
        
        subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=14,
            leading=18,
            textColor=PRIMARY_COLOR,
            spaceAfter=30
        )
        
        h1_style = ParagraphStyle(
            'Heading1_Custom',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=SECONDARY_COLOR,
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )
        
        h2_style = ParagraphStyle(
            'Heading2_Custom',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=PRIMARY_COLOR,
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'Body_Custom',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=TEXT_COLOR,
            spaceAfter=8
        )
        
        th_style = ParagraphStyle(
            'TableHeader_Custom',
            parent=body_style,
            fontName='Helvetica-Bold',
            textColor=colors.white
        )
        
        bullet_style = ParagraphStyle(
            'Bullet_Custom',
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=4
        )

        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=body_style,
            fontName='Helvetica-Bold',
            textColor=SECONDARY_COLOR
        )

        # ------------------ COVER PAGE ------------------
        story.append(Spacer(1, 40))
        story.append(Paragraph("SAASMINER AI", subtitle_style))
        story.append(Paragraph("Product Potential Analysis Report", title_style))
        story.append(Paragraph(f"Project Name: <b>{project_name}</b>", body_style))
        story.append(Paragraph(f"Report Generated: <b>{analysis.get('created_at', 'Just now')}</b>", body_style))
        story.append(Spacer(1, 20))
        
        # Summary KPI Box Table
        score = analysis.get("potential_score", 0)
        domain = analysis.get("domain", "N/A")
        confidence = analysis.get("confidence", 0)
        saas_rec = analysis.get("saas_recommendation") or {}
        prod_title = saas_rec.get("recommended_product", "N/A")
        prod_type = saas_rec.get("product_type", "N/A")
        
        kpi_data = [
            [
                Paragraph("Product Score", meta_label_style),
                Paragraph(f"<font color='{PRIMARY_COLOR.hexval()}'><b>{score}/100</b></font>", title_style)
            ],
            [
                Paragraph("Target Domain", meta_label_style),
                Paragraph(f"{domain} (Conf: {confidence}%)", body_style)
            ],
            [
                Paragraph("Proposed Product", meta_label_style),
                Paragraph(f"<b>{prod_title}</b> ({prod_type})", body_style)
            ],
            [
                Paragraph("Business Potential", meta_label_style),
                Paragraph(f"<b>{(analysis.get('business_potential') or {}).get('business_potential', 'Medium')}</b>", body_style)
            ]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[150, 350])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('BOX', (0,0), (-1,-1), 1, PRIMARY_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 40))
        
        # Executive Summary Paragraph
        story.append(Paragraph("Executive Summary", h1_style))
        summary_text = (
            f"This analysis report examines the codebase characteristics of <b>{project_name}</b> "
            f"to determine its technical reusability and potential transformation into a commercially scalable product. "
            f"Based on code scanning metrics, the project fits best as a <b>{prod_type}</b>. "
            f"The core logic centers around the <b>{domain}</b> domain. "
            f"With key updates identified in the roadmap, this codebase provides a solid foundation for launch."
        )
        story.append(Paragraph(summary_text, body_style))
        story.append(PageBreak())
        
        # ------------------ PAGE 2: TECH STATS & DETECTED MODULES ------------------
        story.append(Paragraph("Repository Scan Statistics", h1_style))
        
        stats_data = [
            [Paragraph("Metric", th_style), Paragraph("Count / Value", th_style)],
            [Paragraph("Total Files", body_style), Paragraph(str(analysis.get("file_count", 0)), body_style)],
            [Paragraph("Total Folders", body_style), Paragraph(str(analysis.get("folder_count", 0)), body_style)],
            [Paragraph("Primary Languages Scanned", body_style), Paragraph(", ".join((analysis.get("languages") or {}).keys()), body_style)],
            [Paragraph("Detected Stack Frameworks", body_style), Paragraph(", ".join(analysis.get("tech_stack") or []) or "Standard script repository", body_style)]
        ]
        stats_table = Table(stats_data, colWidths=[200, 300])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), SECONDARY_COLOR),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 20))
        
        # Detected Modules
        story.append(Paragraph("Detected Modules", h1_style))
        modules = analysis.get("modules") or []
        if not modules:
            story.append(Paragraph("No advanced modular capabilities identified in scan.", body_style))
        else:
            for mod in modules:
                story.append(Paragraph(f"<b>{mod['name']}</b> (Confidence: {mod['confidence']}%)", h2_style))
                story.append(Paragraph(mod['description'], body_style))
                feats = ", ".join(mod.get("features", []))
                story.append(Paragraph(f"<i>Detected Features:</i> {feats}", body_style))
                if mod.get("files"):
                    story.append(Paragraph(f"<i>Reference Files:</i> {', '.join(mod['files'])}", body_style))
                story.append(Spacer(1, 5))
                
        story.append(PageBreak())
        
        # ------------------ PAGE 3: APIS & MICROSERVICES ------------------
        story.append(Paragraph("REST API Opportunities", h1_style))
        story.append(Paragraph("The code analysis engine extracted the following active or proposed HTTP routes suitable for exposed service schemas:", body_style))
        
        apis = analysis.get("apis") or []
        api_rows = [[Paragraph("Method", th_style), Paragraph("Route Path", th_style), Paragraph("Description", th_style)]]
        
        # Limit API display in report to top 8
        for api in apis[:8]:
            api_rows.append([
                Paragraph(f"<b>{api['method']}</b>", body_style),
                Paragraph(api['path'], body_style),
                Paragraph(api.get('description', ''), body_style)
            ])
            
        api_table = Table(api_rows, colWidths=[60, 160, 280])
        api_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ]))
        story.append(api_table)
        if len(apis) > 8:
            story.append(Paragraph(f"<i>* Showing 8 of {len(apis)} API routes. View online dashboard for full interactive tables.</i>", body_style))
            
        story.append(Spacer(1, 20))
        
        # Microservice Transition
        story.append(Paragraph("Microservice Decomposition", h1_style))
        micro = analysis.get("microservices") or {}
        story.append(Paragraph(micro.get("rationale", ""), body_style))
        story.append(Spacer(1, 10))
        
        for idx, svc in enumerate(micro.get("services", [])[:5]):
            story.append(Paragraph(f"<b>{idx+1}. {svc['name']}</b> ({svc['tech_stack']})", h2_style))
            story.append(Paragraph(f"<i>Database:</i> {svc['database']}", body_style))
            story.append(Paragraph(f"<i>Responsibilities:</i> {', '.join(svc['responsibilities'])}", body_style))
            story.append(Spacer(1, 5))
            
        story.append(PageBreak())
        
        # ------------------ PAGE 4: BUSINESS OPPORTUNITIES & ROADMAP ------------------
        story.append(Paragraph("Business Opportunity Analysis", h1_style))
        biz = analysis.get("business_potential") or {}
        
        biz_data = [
            [Paragraph("Target Market", meta_label_style), Paragraph(biz.get("target_market", "N/A"), body_style)],
            [Paragraph("Potential Customers", meta_label_style), Paragraph(biz.get("potential_customers", "N/A"), body_style)],
            [Paragraph("Estimated Market Size", meta_label_style), Paragraph(biz.get("estimated_market_size", "N/A"), body_style)],
            [Paragraph("Monetization Model", meta_label_style), Paragraph(biz.get("monetization", "N/A"), body_style)]
        ]
        biz_table = Table(biz_data, colWidths=[150, 350])
        biz_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(biz_table)
        story.append(Spacer(1, 25))
        
        story.append(Paragraph("Value Proposition Highlights", h1_style))
        for point in biz.get("key_selling_points", []):
            story.append(Paragraph(f"&bull; {point}", bullet_style))
            
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("Productization Roadmap", h1_style))
        for step_idx, step in enumerate(saas_rec.get("roadmap", [])):
            story.append(Paragraph(f"<b>Step {step_idx+1}:</b> {step}", bullet_style))
            
        # ------------------ AI INSIGHTS ------------------
        ai_insights = saas_rec.get("ai_insights") or {}
        if ai_insights:
            story.append(Spacer(1, 20))
            story.append(Paragraph("AI Deep Insights", h1_style))
            story.append(Paragraph(
                "The following insights were generated by the OpenRouter AI engine based on the codebase scan:",
                body_style
            ))
            story.append(Spacer(1, 8))

            insights_data = [
                [Paragraph("Insight", th_style), Paragraph("Detail", th_style)],
            ]
            insight_fields = [
                ("Market Opportunity",  ai_insights.get("market_opportunity", "N/A")),
                ("Monetization Model",  ai_insights.get("monetization_model", "N/A")),
                ("Estimated TAM",       ai_insights.get("estimated_tam", "N/A")),
                ("Competitive Edge",    ai_insights.get("competitive_edge", "N/A")),
                ("Time to Market",      ai_insights.get("time_to_market", "N/A")),
            ]
            for label, value in insight_fields:
                insights_data.append([
                    Paragraph(label, meta_label_style),
                    Paragraph(str(value), body_style)
                ])

            insights_table = Table(insights_data, colWidths=[150, 350])
            insights_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), SECONDARY_COLOR),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BACKGROUND', (0, 1), (-1, -1), LIGHT_BG),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('BOX', (0, 0), (-1, -1), 1, PRIMARY_COLOR),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(insights_table)

        # Build Document
        doc.build(story)
        return output_path

