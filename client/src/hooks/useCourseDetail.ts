import { useEffect, useMemo, useState } from 'react';
import { applyContent, getCourseDetail } from '@/constants/courseDetails';
import type { CourseContentData } from '@/constants/courseDetails';
import { useCourseCatalog } from '@/hooks/useCourseCatalog';
import { getCourseContent } from '@/services/course.service';

/**
 * Everything the Course Details page needs for one course:
 * the course itself (price, rating... from the API, or the built-in catalogue when offline),
 * its page content (written in the admin panel, with generated text for anything left empty),
 * and up to 4 related courses (same category first).
 */
export const useCourseDetail = (slug: string) => {
  const { courses, loaded } = useCourseCatalog();
  const [content, setContent] = useState<CourseContentData | null>(null);
  // true once the content request has finished (successfully or not), so the page does not flash generated text first
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    let active = true;
    setContent(null);
    setContentReady(false);
    getCourseContent(slug)
      .then((data) => active && setContent(data))
      .catch(() => {
        /* offline or unknown course: keep the generated content */
      })
      .finally(() => active && setContentReady(true));
    return () => {
      active = false;
    };
  }, [slug]);

  return useMemo(() => {
    const course = courses.find((c) => c.slug === slug);
    if (!course) return { course: undefined, detail: undefined, related: [], loaded, contentReady };

    const others = courses.filter((c) => c.slug !== slug);
    const related = [...others.filter((c) => c.category === course.category), ...others.filter((c) => c.category !== course.category)].slice(0, 4);

    return { course, detail: applyContent(getCourseDetail(course), content), related, loaded, contentReady };
  }, [courses, slug, loaded, content, contentReady]);
};