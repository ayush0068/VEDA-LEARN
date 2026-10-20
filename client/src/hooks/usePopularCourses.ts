import { useEffect, useState } from 'react';
import { DEFAULT_COURSES } from '@/constants/defaultCourses';
import { getCourses } from '@/services/course.service';
import type { Course } from '@/types';

/** Defaults first (no layout jump, works offline), swapped for API data when it arrives. */
export const usePopularCourses = (limit = 4) => {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES.slice(0, limit));
  const [source, setSource] = useState<'default' | 'api'>('default');

  useEffect(() => {
    let active = true;
    getCourses({ popular: true, limit })
      .then((data) => {
        if (active && data.length > 0) {
          setCourses(data);
          setSource('api');
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      active = false;
    };
  }, [limit]);

  return { courses, source };
};