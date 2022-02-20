/* Copyright 2021, Milkdown by Mirone. */
import './style.css';

import { Editor } from '@milkdown/core';
import { math } from '@milkdown/plugin-math';
import { commonmark } from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';

Editor.make().use(nord).use(commonmark).use(math).create();
