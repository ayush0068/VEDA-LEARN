import { useMemo } from 'react';
import { getCourseDetail } from '@/constants/courseDetails';
import { useCourseCatalog } from '@/hooks/useCourseCatalog';

/**
 * Everything the Course Details page needs for one course:
 * the course itself (price, rating... from the API, or the built-in catalogue when offline),
 * its page content, and up to 4 related courses (same category first).
 */
export const useCourseDetail = (slug: string) => {
  const { courses, loaded } = useCourseCatalog();

  return useMemo(() => {
    const course = courses.find((c) => c.slug === slug);
    if (!course) return { course: undefined, detail: undefined, related: [], loaded };

    const others = courses.filter((c) => c.slug !== slug);
    const related = [...others.filter((c) => c.category === course.category), ...others.filter((c) => c.category !== course.category)].slice(0, 4);

    return { course, detail: getCourseDetail(course), related, loaded };
  }, [courses, slug, loaded]);
};