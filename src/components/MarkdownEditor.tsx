import "@remirror/styles/all.css";

import React, { FC, useCallback } from "react";
import jsx from "refractor/lang/jsx";
import typescript from "refractor/lang/typescript";
import { ExtensionPriority } from "remirror";
import {
  BlockquoteExtension,
  BoldExtension,
  BulletListExtension,
  CodeBlockExtension,
  CodeExtension,
  EmojiExtension,
  HardBreakExtension,
  HeadingExtension,
  IframeExtension,
  ImageExtension,
  ItalicExtension,
  LinkExtension,
  ListItemExtension,
  MarkdownExtension,
  OrderedListExtension,
  PlaceholderExtension,
  StrikeExtension,
  TableExtension,
  TextColorExtension,
  TrailingNodeExtension,
} from "remirror/extensions";
import {
  ComponentItem,
  EditorComponent,
  Remirror,
  ThemeProvider,
  Toolbar,
  ToolbarItemUnion,
  useRemirror,
  useRemirrorContext,
} from "@remirror/react";
import {
  EditorState,
  RemirrorEventListener,
  GetSchema,
  Extension,
} from "@remirror/core";

import { AllStyledComponent } from "@remirror/styles/emotion";
import { FloatingLinkToolbar } from "components/EditorEditDialog";
import { PhotureComponent } from "./PhotureGallery";
import { SelectedImageType } from "./SelectableImage";

export interface MarkdownEditorProps {
  state: EditorState<GetSchema<Extension>>;
  onChange: RemirrorEventListener<Extension>;
  placeholder?: string;
  initialContent?: string;
  className?: string;
}

export const remirrorExtensions = () => [
  new LinkExtension({ autoLink: true }),
  new BoldExtension(),
  new StrikeExtension(),
  new ItalicExtension(),
  new HeadingExtension(),
  new LinkExtension({ autoLink: true }),
  new EmojiExtension(),
  new ImageExtension({ enableResizing: true }),
  new IframeExtension(),
  new BlockquoteExtension(),
  new BulletListExtension({ enableSpine: true }),
  new OrderedListExtension(),
  new ListItemExtension({
    priority: ExtensionPriority.High,
    enableCollapsible: true,
  }),
  new CodeExtension(),
  new CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
  new TrailingNodeExtension(),
  new TableExtension(),
  new MarkdownExtension({ copyAsMarkdown: false }),
  /**
   * `HardBreakExtension` allows us to create a newline inside paragraphs.
   * e.g. in a list item
   */
  new HardBreakExtension(),
  new TextColorExtension(),
];

/*
 * The editor which is used to create the annotation. Supports formatting.
 */
export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  placeholder,
  initialContent,
  className,
  children,
}) => {
  const extensions = useCallback(
    () => [new PlaceholderExtension({ placeholder }), ...remirrorExtensions()],
    [placeholder]
  );

  console.log("extensions", extensions);
  const { manager } = useRemirror({
    extensions,
    stringHandler: "markdown",
  });

  // Callback component has to be here to have access to RemirrorContext
  const PhotureComponentCallback = useCallback(() => {
    const { setContent, getState } = useRemirrorContext();
    const getCurrentContent = () => {
      const state = getState();
      console.log("content", state?.doc?.toJSON());
      const jsonState = state?.doc?.toJSON();
      return jsonState;
    };
    const addPhoture = (photo: SelectedImageType) => {
      const jsonState = getCurrentContent();
      const stateWithAddedContent = jsonState?.content?.concat(photo);
      console.log("stateWithAddedContent", stateWithAddedContent);
      const content = { content: stateWithAddedContent, type: "doc" };
      return setContent(content);
    };
    const removePhoture = (photo: SelectedImageType) => {
      const jsonState = getCurrentContent();
      const copyOfContent = [...jsonState?.content];
      console.log("copyOfContent", copyOfContent);
      const contentIndexOfPhotoToRemove = copyOfContent.findIndex(
        (item) => item.content?.[0]?.attrs?.src === photo.content[0].attrs.src
      );
      console.log("contentIndexOfPhotoToRemove", contentIndexOfPhotoToRemove);
      const slicedArray = [
        ...copyOfContent.slice(0, contentIndexOfPhotoToRemove),
        ...copyOfContent.slice(contentIndexOfPhotoToRemove + 1),
      ];
      console.log("slicedArray", slicedArray);
      const content = { content: slicedArray, type: "doc" };
      return setContent(content);
    };
    return (
      <PhotureComponent
        addPhotoToPublication={addPhoture}
        removePhotoFromPublication={removePhoture}
      />
    );
  }, []);
  return (
    <AllStyledComponent className={className}>
      <ThemeProvider>
        <Remirror manager={manager} autoFocus initialContent={initialContent}>
          <Toolbar items={toolbarItems} refocusEditor label="Top Toolbar" />
          <EditorComponent />
          <FloatingLinkToolbar />
          {children}
          <PhotureComponentCallback />
        </Remirror>
      </ThemeProvider>
    </AllStyledComponent>
  );
};

const toolbarItems: ToolbarItemUnion[] = [
  {
    type: ComponentItem.ToolbarGroup,
    label: "Simple Formatting",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleBold",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleItalic",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleStrike",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleCode",
        display: "icon",
      },
    ],
    separator: "end",
  },
  {
    type: ComponentItem.ToolbarGroup,
    label: "Heading Formatting",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleHeading",
        display: "icon",
        attrs: { level: 1 },
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleHeading",
        display: "icon",
        attrs: { level: 2 },
      },
      {
        type: ComponentItem.ToolbarMenu,

        items: [
          {
            type: ComponentItem.MenuGroup,
            role: "radio",
            items: [
              {
                type: ComponentItem.MenuCommandPane,
                commandName: "toggleHeading",
                attrs: { level: 3 },
              },
              {
                type: ComponentItem.MenuCommandPane,
                commandName: "toggleHeading",
                attrs: { level: 4 },
              },
              {
                type: ComponentItem.MenuCommandPane,
                commandName: "toggleHeading",
                attrs: { level: 5 },
              },
              {
                type: ComponentItem.MenuCommandPane,
                commandName: "toggleHeading",
                attrs: { level: 6 },
              },
            ],
          },
        ],
      },
    ],
    separator: "end",
  },
  {
    type: ComponentItem.ToolbarGroup,
    label: "Simple Formatting",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleBlockquote",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleCodeBlock",
        display: "icon",
      },
    ],
    separator: "end",
  },
  {
    type: ComponentItem.ToolbarGroup,
    label: "History",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "undo",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "redo",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleColumns",
        display: "icon",
        attrs: { count: 2 },
      },
    ],
    separator: "none",
  },
];

export default MarkdownEditor;
