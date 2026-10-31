import { useEffect, useState } from 'react';
import { DEFAULT_CATALOG } from '@/constants/courseCatalog';
import { getCourses } from '@/services/course.service';
import type { Course } from '@/types';

/** Defaults first (no layout jump, works offline), swapped for API data when it arrives. */
export const useCourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_CATALOG);
  const [source, setSource] = useState<'default' | 'api'>('default');
  // true once the API request has finished (successfully or not)
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getCourses()
      .then((data) => {
        if (active && data.length > 0) {
          setCourses(data);
          setSource('api');
        }
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { courses, source, loaded };
};