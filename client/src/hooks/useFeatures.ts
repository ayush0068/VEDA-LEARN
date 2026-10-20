import { useEffect, useState } from 'react';
import { DEFAULT_FEATURES } from '@/constants/defaultFeatures';
import { getFeatures } from '@/services/feature.service';
import type { Feature } from '@/types';

/**
 * Starts with built-in defaults (no layout jump, works offline) and swaps in
 * API data when it arrives. If the API/DB is down the defaults simply stay.
 */
export const useFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>(DEFAULT_FEATURES);
  const [source, setSource] = useState<'default' | 'api'>('default');

  useEffect(() => {
    let active = true;
    getFeatures()
      .then((data) => {
        if (active && data.length > 0) {
          setFeatures(data);
          setSource('api');
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      active = false;
    };
  }, []);

  return { features, source };
};