import React from 'react';
import { Provider, connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Editor } from '@tinymce/tinymce-react';

import 'tinymce';
import 'tinymce/themes/silver';
import 'tinymce/skins/ui/oxide/skin.css';
import 'tinymce/icons/default';
import 'frontend-components-tinymce-advanced-plugins';

import store from '../../data/store';
import { selectors } from '../../data/redux';
import ImageUploadModal from '../ImageUploadModal';
import SourceCodeModal from '../SourceCodeModal';
import InsertLinkModal from '../InsertLinkModal';
import ConfirmLinkFormatAlert from '../InsertLinkModal/ConfirmLinkFormatAlert';
import * as hooks from './hooks';
import messages from './messages';
import './customTinyMcePlugins/embedIframePlugin';

const editorConfigDefaultProps = {
  setEditorRef: undefined,
  placeholder: undefined,
  initializeEditor: undefined,
  updateContent: undefined,
  content: undefined,
  minHeight: undefined,
};

const editorConfigPropTypes = {
  setEditorRef: PropTypes.func,
  placeholder: PropTypes.any,
  initializeEditor: PropTypes.func,
  updateContent: PropTypes.func,
  content: PropTypes.any,
  minHeight: PropTypes.any,
};

export const TinyMceWidget = ({
  editorType,
  editorRef,
  disabled,
  id,
  courseId,
  editorContentHtml, // editorContent in html form
  // redux
  assets,
  isLibrary,
  lmsEndpointUrl,
  studioEndpointUrl,
  onChange,
  ...editorConfig
}) => {
  const translations = hooks.useTranslations(messages);
  const { isImgOpen, openImgModal, closeImgModal } = hooks.imgModalToggle();
  const { isSourceCodeOpen, openSourceCodeModal, closeSourceCodeModal } = hooks.sourceCodeModalToggle(editorRef);
  const { isInsertLinkOpen, openInsertLinkModal, closeInsertLinkModal } = hooks.insertLinkModalToggle();
  const { imagesRef } = hooks.useImages({ assets, editorContentHtml });
  const { insertLinkModalUrl, setInsertLinkModalUrl, closeInsertLinkModalURL } = hooks.insertLinkModalToggleURLValue();

  const imageSelection = hooks.selectedImage(null);

  const handleChangeFormatUrl = (url) => {
    closeInsertLinkModal();
    setInsertLinkModalUrl(url);
  };

  return (
    <Provider store={store}>
      {isLibrary ? null : (
        <ImageUploadModal
          isOpen={isImgOpen}
          close={closeImgModal}
          editorRef={editorRef}
          images={imagesRef}
          editorType={editorType}
          lmsEndpointUrl={lmsEndpointUrl}
          {...imageSelection}
        />
      )}

      {insertLinkModalUrl && (
        <ConfirmLinkFormatAlert
          url={insertLinkModalUrl}
          onCloseAlert={closeInsertLinkModalURL}
          onCloseModalInsertLink={closeInsertLinkModal}
          editorRef={editorRef}
        />
      )}

      {isInsertLinkOpen && (
        <InsertLinkModal
          isOpen={isInsertLinkOpen}
          onClose={closeInsertLinkModal}
          courseId={courseId}
          editorRef={editorRef}
          lmsEndpointUrl={lmsEndpointUrl}
          onOpenAlertUrlFormat={handleChangeFormatUrl}
        />
      )}
      {editorType === 'text' ? (
        <SourceCodeModal
          isOpen={isSourceCodeOpen}
          close={closeSourceCodeModal}
          editorRef={editorRef}
        />
      ) : null}
      <Editor
        id={id}
        disabled={disabled}
        onEditorChange={onChange}
        {...hooks.editorConfig({
          openImgModal,
          openSourceCodeModal,
          openInsertLinkModal,
          translations,
          editorType,
          editorRef,
          isLibrary,
          lmsEndpointUrl,
          studioEndpointUrl,
          images: imagesRef,
          editorContentHtml,
          ...imageSelection,
          ...editorConfig,
        })}
      />
    </Provider>
  );
};
TinyMceWidget.defaultProps = {
  isLibrary: null,
  editorType: null,
  editorRef: null,
  lmsEndpointUrl: null,
  studioEndpointUrl: null,
  assets: null,
  id: null,
  disabled: false,
  editorContentHtml: undefined,
  updateContent: undefined,
  onChange: () => ({}),
  ...editorConfigDefaultProps,
};
TinyMceWidget.propTypes = {
  editorType: PropTypes.string,
  isLibrary: PropTypes.bool,
  assets: PropTypes.shape({}),
  editorRef: PropTypes.shape({}),
  courseId: PropTypes.string,
  lmsEndpointUrl: PropTypes.string,
  studioEndpointUrl: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  editorContentHtml: PropTypes.string,
  updateContent: PropTypes.func,
  onChange: PropTypes.func,
  ...editorConfigPropTypes,
};

export const mapStateToProps = (state) => ({
  assets: selectors.app.assets(state),
  lmsEndpointUrl: selectors.app.lmsEndpointUrl(state),
  studioEndpointUrl: selectors.app.studioEndpointUrl(state),
  isLibrary: selectors.app.isLibrary(state),
  courseId: selectors.app.learningContextId(state),
});

export default (connect(mapStateToProps)(TinyMceWidget));
