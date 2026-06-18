import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument = require('pdfkit');

/**
 * Port of Procraft.Infrastructure.Pdf.QuestPdfService: same A4 layout,
 * section order, date formats and link handling. QuestPDF's Arial maps to the
 * metrically-compatible Helvetica family.
 *
 * Section headings and other fixed strings (locations, "Present", experience /
 * education type names, …) are localised to the resume language (uz/en/ru).
 * Uzbek and English render with the built-in Helvetica, exactly as before.
 * Russian needs a Unicode font because pdfkit's Helvetica only covers Latin-1
 * (WinAnsi) and silently drops Cyrillic glyphs — for it we embed Noto Sans.
 */

const UPLOADS_PUBLIC_ORIGIN = 'https://api.procraft.uz';

const HEADING_COLOR = '#263238'; // BlueGrey Darken4
const SUBTITLE_COLOR = '#455A64'; // BlueGrey Darken2
const BODY_COLOR = '#37474F'; // BlueGrey Darken3
const MUTED_COLOR = '#616161'; // Grey Darken2
const RULE_COLOR = '#E0E0E0'; // Grey Lighten2
const SECTION_RULE_COLOR = '#BDBDBD'; // Grey Lighten1
const FOOTER_COLOR = '#757575'; // Grey Darken1
const LINK_COLOR = '#1976D2'; // Blue Darken2

// Embedded Unicode font for Cyrillic resumes. Copied to dist/pdf/fonts by the
// build script; absent during ad-hoc ts-node runs, hence the runtime guard.
const UNICODE_FONT_DIR = join(__dirname, 'fonts');
const UNICODE_REGULAR_PATH = join(UNICODE_FONT_DIR, 'NotoSans-Regular.ttf');
const UNICODE_BOLD_PATH = join(UNICODE_FONT_DIR, 'NotoSans-Bold.ttf');
const UNICODE_FONT_AVAILABLE = existsSync(UNICODE_REGULAR_PATH) && existsSync(UNICODE_BOLD_PATH);

export type PdfLang = 'uz' | 'en' | 'ru';

interface PdfLabels {
  location: string;
  socialLinks: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certificates: string;
  now: string;
  generalCategory: string;
  privateRepo: string;
  liveLink: string;
  github: string;
  certificateLink: string;
  experienceTypes: Record<string, string>;
  educationTypes: Record<string, string>;
}

const LABELS: Record<PdfLang, PdfLabels> = {
  uz: {
    location: 'Joylashuv',
    socialLinks: 'Ijtimoiy havolalar',
    summary: "Qisqa ma'lumot",
    experience: 'Ish tajribasi',
    education: "Ta'lim",
    skills: "Ko'nikmalar",
    projects: 'Loyihalar',
    certificates: 'Sertifikatlar',
    now: 'Hozir',
    generalCategory: 'Umumiy',
    privateRepo: 'Yopiq repository',
    liveLink: 'Live link',
    github: 'GitHub',
    certificateLink: 'Sertifikat',
    experienceTypes: {
      freelance: 'Freelance',
      project: 'Shaxsiy loyiha',
      internship: 'Amaliyot',
      volunteer: 'Volunteer',
      work: 'Ish joyi',
    },
    educationTypes: {
      course: 'Kurs / bootcamp',
      self: "Shaxsiy o'rganish",
      mentor: 'Mentor / ustoz',
      online: 'Onlayn kurs',
      formal: 'Universitet / kollej',
    },
  },
  en: {
    location: 'Location',
    socialLinks: 'Social links',
    summary: 'Summary',
    experience: 'Work experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certificates: 'Certificates',
    now: 'Present',
    generalCategory: 'General',
    privateRepo: 'Private repository',
    liveLink: 'Live link',
    github: 'GitHub',
    certificateLink: 'Certificate',
    experienceTypes: {
      freelance: 'Freelance',
      project: 'Personal project',
      internship: 'Internship',
      volunteer: 'Volunteer',
      work: 'Employment',
    },
    educationTypes: {
      course: 'Course / bootcamp',
      self: 'Self-learning',
      mentor: 'Mentor',
      online: 'Online course',
      formal: 'University / college',
    },
  },
  ru: {
    location: 'Местоположение',
    socialLinks: 'Социальные ссылки',
    summary: 'Краткая информация',
    experience: 'Опыт работы',
    education: 'Образование',
    skills: 'Навыки',
    projects: 'Проекты',
    certificates: 'Сертификаты',
    now: 'Настоящее время',
    generalCategory: 'Общие',
    privateRepo: 'Закрытый репозиторий',
    liveLink: 'Live ссылка',
    github: 'GitHub',
    certificateLink: 'Сертификат',
    experienceTypes: {
      freelance: 'Фриланс',
      project: 'Личный проект',
      internship: 'Стажировка',
      volunteer: 'Волонтёрство',
      work: 'Трудоустройство',
    },
    educationTypes: {
      course: 'Курс / bootcamp',
      self: 'Самообучение',
      mentor: 'Ментор',
      online: 'Онлайн-курс',
      formal: 'Университет / колледж',
    },
  },
};

/** Maps an arbitrary i18n language tag (e.g. "ru-RU") to a supported PdfLang. */
function normalizeLang(value: string | null | undefined): PdfLang {
  const code = (value ?? '').trim().toLowerCase().slice(0, 2);
  return code === 'en' || code === 'ru' ? code : 'uz';
}

/** Per-render context: language labels plus the resolved font family names. */
interface RenderContext {
  labels: PdfLabels;
  fontRegular: string;
  fontBold: string;
}

export interface PdfSkillModel {
  name: string;
  level: number | null;
  category: string | null;
}

export interface PdfProjectModel {
  name: string;
  description: string | null;
  githubUrl: string | null;
  isRepositoryPrivate: boolean;
  liveUrl: string | null;
}

export interface PdfExperienceModel {
  company: string;
  experienceType: string;
  position: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export interface PdfEducationModel {
  institution: string;
  educationType: string;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface PdfCertificateModel {
  name: string;
  issuer: string | null;
  issuedOn: string | null;
  url: string | null;
}

export interface PdfSocialLinkModel {
  platform: string;
  url: string;
}

export interface PdfResumeModel {
  fullName: string;
  title: string | null;
  summary: string | null;
  location: string | null;
  skills: PdfSkillModel[];
  projects: PdfProjectModel[];
  experiences: PdfExperienceModel[];
  educations: PdfEducationModel[];
  certificates: PdfCertificateModel[];
  socialLinks: PdfSocialLinkModel[];
  templateSlug: string | null;
  /** Active UI language; section labels follow it. Defaults to Uzbek. */
  lang?: string | null;
}

function formatDate(date: string | null): string {
  return date ? date.slice(0, 7) : '';
}

/** Experience overload: always "start - end|now". Education overload: empty when both missing. */
function formatDateRange(
  labels: PdfLabels,
  startDate: string | null,
  endDate: string | null,
  isCurrent?: boolean,
): string {
  const start = formatDate(startDate);
  const end = isCurrent === true ? labels.now : formatDate(endDate);

  if (isCurrent === undefined && start === '' && end === '') {
    return '';
  }

  return `${start} - ${end}`;
}

function formatSkill(skill: PdfSkillModel): string {
  return skill.level !== null && skill.level !== undefined ? `${skill.name} (${skill.level}/5)` : skill.name;
}

function formatEducationType(labels: PdfLabels, type: string): string {
  return labels.educationTypes[type] ?? '';
}

function formatExperienceType(labels: PdfLabels, type: string): string {
  return labels.experienceTypes[type] ?? '';
}

function joinNonEmpty(separator: string, ...values: Array<string | null | undefined>): string {
  return values.filter((value) => value && value.trim() !== '').join(separator);
}

function normalizeLinkValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith('/uploads/')) {
    return `${UPLOADS_PUBLIC_ORIGIN}${trimmed}`;
  }
  return trimmed;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable()
export class PdfService {
  async generateResume(resume: PdfResumeModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 34, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const lang = normalizeLang(resume.lang);

        // Cyrillic needs the embedded Unicode font; Latin languages keep the
        // built-in Helvetica so their output stays byte-for-byte unchanged.
        const useUnicodeFont = lang === 'ru' && UNICODE_FONT_AVAILABLE;
        if (useUnicodeFont) {
          doc.registerFont('Body', UNICODE_REGULAR_PATH);
          doc.registerFont('Body-Bold', UNICODE_BOLD_PATH);
        }

        const ctx: RenderContext = {
          labels: LABELS[lang],
          fontRegular: useUnicodeFont ? 'Body' : 'Helvetica',
          fontBold: useUnicodeFont ? 'Body-Bold' : 'Helvetica-Bold',
        };

        this.compose(doc, resume, ctx);

        // Footer on every page.
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i += 1) {
          doc.switchToPage(i);
          doc
            .font(ctx.fontRegular)
            .fontSize(8)
            .fillColor(FOOTER_COLOR)
            .text('Generated by Procraft', doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 14, {
              width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
              align: 'center',
              lineBreak: false,
            });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private compose(doc: PDFKit.PDFDocument, resume: PdfResumeModel, ctx: RenderContext): void {
    this.composeHeader(doc, resume, ctx);
    this.composeSummary(doc, resume, ctx);
    this.composeExperiences(doc, resume.experiences, ctx);
    this.composeEducations(doc, resume.educations, ctx);
    this.composeSkills(doc, resume.skills, ctx);
    this.composeProjects(doc, resume.projects, ctx);
    this.composeCertificates(doc, resume.certificates, ctx);
  }

  private contentWidth(doc: PDFKit.PDFDocument): number {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private composeHeader(doc: PDFKit.PDFDocument, resume: PdfResumeModel, ctx: RenderContext): void {
    const left = doc.page.margins.left;
    const width = this.contentWidth(doc);
    const hasLinks = resume.socialLinks.length > 0;
    const rightColumnWidth = 190;
    const leftColumnWidth = hasLinks ? width - rightColumnWidth : width;
    const top = doc.y;

    doc.font(ctx.fontBold).fontSize(24).fillColor(HEADING_COLOR);
    doc.text(resume.fullName, left, top, { width: leftColumnWidth });

    if (resume.title && resume.title.trim() !== '') {
      doc.moveDown(0.2);
      doc.font(ctx.fontBold).fontSize(12).fillColor(SUBTITLE_COLOR);
      doc.text(resume.title, left, doc.y, { width: leftColumnWidth });
    }

    if (resume.location && resume.location.trim() !== '') {
      doc.moveDown(0.2);
      doc.font(ctx.fontBold).fontSize(9.5).fillColor(MUTED_COLOR);
      doc.text(`${ctx.labels.location}: `, left, doc.y, { width: leftColumnWidth, continued: true });
      doc.font(ctx.fontRegular).text(resume.location);
    }

    const leftBottom = doc.y;
    let rightBottom = top;

    if (hasLinks) {
      const rightX = left + leftColumnWidth;
      doc.font(ctx.fontBold).fontSize(8).fillColor(HEADING_COLOR);
      doc.text(ctx.labels.socialLinks, rightX, top, { width: rightColumnWidth });

      for (const link of resume.socialLinks) {
        this.addLinkLine(doc, ctx, link.platform, link.url, 8, rightX, rightColumnWidth);
      }

      rightBottom = doc.y;
    }

    const bottom = Math.max(leftBottom, rightBottom) + 4;
    doc
      .moveTo(left, bottom)
      .lineTo(left + width, bottom)
      .lineWidth(1)
      .strokeColor(RULE_COLOR)
      .stroke();

    doc.x = left;
    doc.y = bottom + 11;
  }

  private composeSection(doc: PDFKit.PDFDocument, ctx: RenderContext, title: string, content: () => void): void {
    const left = doc.page.margins.left;
    const width = this.contentWidth(doc);

    if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
      doc.addPage();
    }

    doc.font(ctx.fontBold).fontSize(10).fillColor(HEADING_COLOR);
    doc.text(title, left, doc.y, { width });

    const ruleY = doc.y + 3;
    doc
      .moveTo(left, ruleY)
      .lineTo(left + width, ruleY)
      .lineWidth(1)
      .strokeColor(SECTION_RULE_COLOR)
      .stroke();

    doc.x = left;
    doc.y = ruleY + 5;

    content();

    doc.x = left;
    doc.y += 11;
  }

  private composeSummary(doc: PDFKit.PDFDocument, resume: PdfResumeModel, ctx: RenderContext): void {
    if (!resume.summary || resume.summary.trim() === '') {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.summary, () => {
      doc.font(ctx.fontRegular).fontSize(9.5).fillColor(BODY_COLOR);
      doc.text(resume.summary!, doc.page.margins.left, doc.y, { width: this.contentWidth(doc), lineGap: 2.5 });
    });
  }

  private composeExperiences(doc: PDFKit.PDFDocument, experiences: PdfExperienceModel[], ctx: RenderContext): void {
    if (experiences.length === 0) {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.experience, () => {
      const left = doc.page.margins.left;
      const width = this.contentWidth(doc);

      for (const item of experiences) {
        const dateText = formatDateRange(ctx.labels, item.startDate, item.endDate, item.isCurrent);

        doc.font(ctx.fontBold).fontSize(9.5).fillColor(HEADING_COLOR);
        const rowY = doc.y;
        doc.text(item.position, left, rowY, { width: width - 120 });
        const afterPosition = doc.y;

        if (dateText !== '') {
          doc.font(ctx.fontRegular).fontSize(8).fillColor(MUTED_COLOR);
          doc.text(dateText, left + width - 120, rowY, { width: 120, align: 'right', lineBreak: false });
        }

        // Restore the cursor below the (possibly wrapped) left column so the
        // next line never overlaps the title or the right-aligned date.
        doc.y = afterPosition;
        doc.moveDown(0.2);
        doc.font(ctx.fontRegular).fontSize(8.5).fillColor(MUTED_COLOR);
        doc.text(joinNonEmpty(' • ', item.company, formatExperienceType(ctx.labels, item.experienceType)), left, doc.y, {
          width,
        });

        if (item.description && item.description.trim() !== '') {
          doc.moveDown(0.2);
          doc.font(ctx.fontRegular).fontSize(9).fillColor('black');
          doc.text(item.description, left, doc.y, { width, lineGap: 2 });
        }

        doc.y += 5;
      }
    });
  }

  private composeEducations(doc: PDFKit.PDFDocument, educations: PdfEducationModel[], ctx: RenderContext): void {
    if (educations.length === 0) {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.education, () => {
      const left = doc.page.margins.left;
      const width = this.contentWidth(doc);

      for (const item of educations) {
        const rowY = doc.y;

        doc.font(ctx.fontBold).fontSize(9.5).fillColor(HEADING_COLOR);
        doc.text(item.institution, left, rowY, { width: width - 120 });
        const afterInstitution = doc.y;

        const dateText = formatDateRange(ctx.labels, item.startDate, item.endDate);
        if (dateText !== '') {
          doc.font(ctx.fontRegular).fontSize(8).fillColor(MUTED_COLOR);
          doc.text(dateText, left + width - 120, rowY, {
            width: 120,
            align: 'right',
            lineBreak: false,
          });
        }

        // Restore the cursor below the institution line; education dates are
        // optional, and an empty right-column draw would otherwise pull doc.y
        // back up and overlap the next line onto the institution name.
        doc.y = afterInstitution;
        doc.moveDown(0.15);
        doc.font(ctx.fontRegular).fontSize(8.5).fillColor(MUTED_COLOR);
        doc.text(
          joinNonEmpty(' • ', formatEducationType(ctx.labels, item.educationType), item.degree, item.field),
          left,
          doc.y,
          { width },
        );

        doc.y += 4;
      }
    });
  }

  private composeSkills(doc: PDFKit.PDFDocument, skills: PdfSkillModel[], ctx: RenderContext): void {
    if (skills.length === 0) {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.skills, () => {
      const left = doc.page.margins.left;
      const width = this.contentWidth(doc);

      const groups = new Map<string, PdfSkillModel[]>();
      for (const skill of skills) {
        const key = skill.category && skill.category.trim() !== '' ? skill.category.trim() : ctx.labels.generalCategory;
        (groups.get(key) ?? groups.set(key, []).get(key)!).push(skill);
      }

      const ordered = [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

      for (const [category, items] of ordered) {
        doc.font(ctx.fontBold).fontSize(9.5).fillColor(HEADING_COLOR);
        doc.text(`${category}: `, left, doc.y, { width, continued: true });
        doc.font(ctx.fontRegular).fillColor(BODY_COLOR);
        doc.text(items.map(formatSkill).join(', '));
        doc.y += 2;
      }
    });
  }

  private composeProjects(doc: PDFKit.PDFDocument, projects: PdfProjectModel[], ctx: RenderContext): void {
    if (projects.length === 0) {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.projects, () => {
      const left = doc.page.margins.left;
      const width = this.contentWidth(doc);

      for (const item of projects) {
        doc.font(ctx.fontBold).fontSize(9.5).fillColor(HEADING_COLOR);
        doc.text(item.name, left, doc.y, { width });

        if (item.description && item.description.trim() !== '') {
          doc.moveDown(0.2);
          doc.font(ctx.fontRegular).fontSize(9).fillColor('black');
          doc.text(item.description, left, doc.y, { width, lineGap: 2 });
        }

        if (item.liveUrl && item.liveUrl.trim() !== '') {
          this.addLinkLine(doc, ctx, ctx.labels.liveLink, item.liveUrl, 8, left, width);
        }

        if (item.isRepositoryPrivate) {
          doc.font(ctx.fontBold).fontSize(8).fillColor(MUTED_COLOR);
          doc.text(`${ctx.labels.github}: `, left, doc.y, { width, continued: true });
          doc.font(ctx.fontRegular).text(ctx.labels.privateRepo);
        } else if (item.githubUrl && item.githubUrl.trim() !== '') {
          this.addLinkLine(doc, ctx, ctx.labels.github, item.githubUrl, 8, left, width);
        }

        doc.y += 7;
      }
    });
  }

  private composeCertificates(doc: PDFKit.PDFDocument, certificates: PdfCertificateModel[], ctx: RenderContext): void {
    if (certificates.length === 0) {
      return;
    }

    this.composeSection(doc, ctx, ctx.labels.certificates, () => {
      const left = doc.page.margins.left;
      const width = this.contentWidth(doc);

      for (const item of certificates) {
        doc.font(ctx.fontBold).fontSize(9.5).fillColor(HEADING_COLOR);
        doc.text(item.name, left, doc.y, { width });

        const meta = joinNonEmpty(' • ', item.issuer, formatDate(item.issuedOn));
        if (meta !== '') {
          doc.moveDown(0.15);
          doc.font(ctx.fontRegular).fontSize(8.5).fillColor(MUTED_COLOR);
          doc.text(meta, left, doc.y, { width });
        }

        if (item.url && item.url.trim() !== '') {
          this.addLinkLine(doc, ctx, ctx.labels.certificateLink, item.url, 8, left, width);
        }

        doc.y += 5;
      }
    });
  }

  private addLinkLine(
    doc: PDFKit.PDFDocument,
    ctx: RenderContext,
    label: string,
    value: string,
    fontSize: number,
    x: number,
    width: number,
  ): void {
    if (!value || value.trim() === '') {
      return;
    }

    const linkValue = normalizeLinkValue(value);

    doc.font(ctx.fontBold).fontSize(fontSize).fillColor(MUTED_COLOR);
    doc.text(`${label}: `, x, doc.y, { width, continued: true });

    if (isHttpUrl(linkValue)) {
      doc.font(ctx.fontRegular).fillColor(LINK_COLOR).text(linkValue, { link: linkValue, underline: true });
    } else {
      doc.font(ctx.fontRegular).fillColor(MUTED_COLOR).text(linkValue);
    }
  }
}
