/* Copyright 2021, Milkdown by Mirone. */
import { createSlice, createTimer, MilkdownPlugin, Timer } from '@milkdown/ctx';
import { EditorView, Plugin, PluginKey, ViewFactory } from '@milkdown/prose';

import { editorStateCtx, EditorStateReady } from './editor-state';
import { InitReady, prosePluginsCtx, viewCtx } from './init';

type EditorOptions = Omit<ConstructorParameters<typeof EditorView>[1], 'state'>;

type RootType = Node | undefined | null | string;

export const editorViewCtx = createSlice({} as EditorView, 'editorView');
export const editorViewOptionsCtx = createSlice({} as EditorOptions, 'editorViewOptions');
export const rootCtx = createSlice(null as RootType, 'root');
export const editorViewTimerCtx = createSlice([] as Timer[], 'editorViewTimer');

export const EditorViewReady = createTimer('EditorViewReady');

const createViewContainer = (root: Node) => {
    const container = document.createElement('div');
    container.className = 'milkdown';
    root.appendChild(container);

    return container;
};

const prepareViewDom = (dom: Element) => {
    dom.classList.add('editor');
    dom.setAttribute('role', 'textbox');
};

const key = new PluginKey('MILKDOWN_VIEW_CLEAR');

export const editorView: MilkdownPlugin = (pre) => {
    pre.inject(rootCtx, document.body)
        .inject(editorViewCtx)
        .inject(editorViewOptionsCtx)
        .inject(editorViewTimerCtx, [EditorStateReady])
        .record(EditorViewReady);

    return async (ctx) => {
        await ctx.wait(InitReady);

        const root = ctx.get(rootCtx) || document.body;
        const el = typeof root === 'string' ? document.querySelector(root) : root;

        ctx.update(prosePluginsCtx, (xs) => [
            new Plugin({
                key,
                view: (editorView) => {
                    const container = el ? createViewContainer(el) : undefined;

                    const handleDOM = () => {
                        if (container && el) {
                            const editor = editorView.dom;
                            el.replaceChild(container, editor);
                            container.appendChild(editor);
                        }
                    };
                    handleDOM();
                    return {
                        destroy: () => {
                            if (container?.parentNode) {
                                container?.parentNode.replaceChild(editorView.dom, container);
                            }
                            container?.remove();
                        },
                    };
                },
            }),
            ...xs,
        ]);

        await ctx.waitTimers(editorViewTimerCtx);

        const state = ctx.get(editorStateCtx);
        const options = ctx.get(editorViewOptionsCtx);
        const nodeViews = Object.fromEntries(ctx.get(viewCtx) as [string, ViewFactory][]);
        const view = new EditorView(el as Node, {
            state,
            nodeViews,
            ...options,
        });
        prepareViewDom(view.dom);
        ctx.set(editorViewCtx, view);
        ctx.done(EditorViewReady);
    };
};
