/** "Acharya Devendra Shastri" -> "acharya-devendra-shastri" */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---- files that live in client/public (served from the site root) ----
/** public/images/instructors/<instructor-name>.png */
export const instructorPhoto = (name: string): string => `/images/instructors/${slugify(name)}.png`;
/** public/images/reviewers/<student-name>.png */
export const reviewerPhoto = (name: string): string => `/images/reviewers/${slugify(name)}.png`;
/** public/videos/previews/<course-slug>.mp4 */
export const previewVideo = (courseSlug: string): string => `/videos/previews/${courseSlug}.mp4`;
/** public/downloads/<course-slug>-syllabus.pdf */
export const syllabusFile = (courseSlug: string): string => `/downloads/${courseSlug}-syllabus.pdf`;

/** 12 -> "12", 10000 -> "10,000+" */
export const formatPlus = (value: number): string => `${new Intl.NumberFormat('en-IN').format(value)}+`;

/**
 * True when `url` really is a file of this type. (In dev / on most hosts a missing file still answers
 * 200 with index.html, so the content type has to be checked too.)
 */
export const fileExists = async (url: string, mimePart: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').includes(mimePart);
  } catch {
    return false;
  }
};