import React, { useRef, useState } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { NAVBAR_HEIGHT } from 'renderer/constants/ui';
import PerfectScrollbar from 'react-perfect-scrollbar';
import NavigatorTree from 'renderer/layout/navigator/components/sidebar/tree/NavigatorTree';
import SearchTextField from 'renderer/components/input/SearchTextField';
import { FilterListOutlined } from '@mui/icons-material';
import CreateItemMenu from 'renderer/layout/navigator/components/sidebar/menus/CreateItemMenu';
import SearchItemMenu from 'renderer/layout/navigator/components/sidebar/menus/SearchItemMenu';
import CreateItemContextMenu from 'renderer/layout/navigator/components/sidebar/menus/CreateItemContextMenu';

type NavigatorSidebarProps = {
  width: number;
};

export default function NavigatorSidebar({ width }: NavigatorSidebarProps) {
  const [search, setSearch] = useState<string>('');

  const contextMenuRef = useRef<HTMLElement>(null);

  return (
    <>
      <CreateItemContextMenu contextMenuRef={contextMenuRef} />

      <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: NAVBAR_HEIGHT, minHeight: NAVBAR_HEIGHT, display: 'flex', flexDirection: 'column' }}>
          <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={{ flexGrow: 1, px: 0.5 }}>
            <Box>
              <CreateItemMenu />
            </Box>
            <SearchTextField
              size={'small'}
              icon={FilterListOutlined}
              placeholder={''}
              value={search}
              onChangeValue={setSearch}
            />
            <Box>
              <SearchItemMenu />
            </Box>
          </Stack>

          <Divider />
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }} ref={contextMenuRef}>
          <PerfectScrollbar options={{ wheelPropagation: false }}>
            <NavigatorTree width={width} search={search} />
          </PerfectScrollbar>
        </Box>
      </Box>
    </>
  );
}
