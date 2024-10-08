import React, { useCallback, useEffect, useState } from 'react';
import { HelpOutlineOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { getUrlInfo } from '../../../../utils/urlUtils';
import { useAnalyticsContext } from '../../../../contexts/AnalyticsContext';
import NavbarIconButton from './NavbarIconButton';

export default function HelpMenu() {
  const { pathname } = useLocation();
  const { track } = useAnalyticsContext();

  const [url, setUrl] = useState<string | undefined>(undefined);

  const openUrlHandler = useCallback((): void => {
    window.open(url, '_blank');

    const urlInfo = getUrlInfo(pathname);
    track({
      name: 'help_documentation_open',
      properties: { help_url: url, page_title: urlInfo?.path, page_location: urlInfo?.url },
    });
  }, [url, pathname]);

  useEffect(() => {
    if (!pathname) {
      setUrl(undefined);
      return;
    }

    const urlInfo = getUrlInfo(pathname);
    if (!urlInfo) {
      setUrl(undefined);
      return;
    }

    setUrl(urlInfo.helpUrl);
  }, [pathname]);

  if (!url) {
    return null;
  }

  return <NavbarIconButton titleId={'documentation'} icon={'HelpOutlineOutlined'} onClick={openUrlHandler} />;
}
