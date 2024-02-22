import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { logError } from '@edx/frontend-platform/logging';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Button,
  Tabs,
  Tab,
  Form,
} from '@openedx/paragon';
import { actions, selectors } from '../../data/redux/insertlink';
import BaseModal from '../BaseModal';
import BlocksList from './BlocksList';
import BlockLink from './BlockLink';
import SearchBlocks from './SearchBlocks';
import { formatBlocks, isValidURL } from './utils';
import { getBlocksFromCourse } from './api';

import messages from './messages';
import './index.scss';

const InsertLinkModal = ({
  courseId,
  isOpen,
  onClose,
  editorRef,
}) => {
  const intl = useIntl();
  const [searchField, setSearchField] = useState('');
  const [blocksSearched, setBlocksSearched] = useState(false);
  const [blockSelected, setBlocksSelected] = useState(null);
  const [blocksList, setBlocksList] = useState(null);
  const [, setInvalidUrlInput] = useState(false);
  const [inputUrlValue, setInputUrlValue] = useState('');
  const [errorUrlNotSelected, setErrorUrlNotSelected] = useState(false);
  const dispatch = useDispatch();
  const { selectedBlocks } = useSelector(selectors.insertlinkState);

  const handleSearchedBlocks = (isSearched) => {
    setBlocksSearched(isSearched);
  };

  const handleSelectedBlock = (blockSelectedFromList) => {
    setBlocksSelected(blockSelectedFromList);
    setInputUrlValue('');
  };

  const handleCloseLink = () => {
    setSearchField('');
    setBlocksSelected(null);
  };

  /* istanbul ignore next */
  const handleSave = () => {
    const editor = editorRef.current;
    const urlPath = blockSelected?.lmsWebUrl || inputUrlValue;
    const blockId = blockSelected?.blockId;
    if (editor && urlPath) {
      const validateUrl = isValidURL(urlPath);

      if (!validateUrl) {
        setInvalidUrlInput(true);
        return;
      }

      const selectedRange = editor.selection.getRng();
      const selectedText = editor.selection.getContent({ format: 'text' });

      const newLinkNode = editor.dom.create('a', {
        href: urlPath,
        'data-mce-href': urlPath,
        'data-block-id': blockId,
        target: '_blank',
      });

      newLinkNode.textContent = selectedText;

      selectedRange.deleteContents();
      selectedRange.insertNode(newLinkNode);
      // Remove empty "a" tags after replacing URLs
      const editorContent = editor.getContent();
      const modifiedContent = editorContent.replace(/<a\b[^>]*><\/a>/gi, '');
      editor.setContent(modifiedContent);

      dispatch(actions.addBlock({ [blockId]: blockSelected }));
    }

    onClose();
  };

  useEffect(() => {
    const getBlocksList = async () => {
      try {
        const blocksData = await getBlocksFromCourse(courseId);
        const { blocks: blocksResponse, root: rootBlocksResponse } = blocksData;
        const blockListFormatted = formatBlocks(
          blocksResponse,
          rootBlocksResponse,
        );
        setBlocksList(blockListFormatted);
      } catch (error) {
        logError(error);
      }
    };

    getBlocksList();
  }, []);

  useEffect(() => {
    /* istanbul ignore next */
    const editor = editorRef.current;
    if (editor) {
      const selectedHTML = editor.selection.getContent({ format: 'html' });
      const regex = /data-block-id="([^"]+)"/;
      const match = selectedHTML.match(regex);

      // Extracting the value from the match
      const dataBlockId = match ? match[1] : null;
      if (selectedHTML && !dataBlockId) {
        const selectedNode = editor.selection.getNode();
        const parentNode = editor.dom.getParent(selectedNode, 'a');
        if (parentNode) {
          const dataBlockIdParent = parentNode.getAttribute('data-block-id');
          const blockIsValid = dataBlockIdParent in selectedBlocks;
          if (dataBlockIdParent && blockIsValid) {
            setBlocksSelected(selectedBlocks[dataBlockIdParent]);
          }
        }
      }

      if (dataBlockId) {
        const blockIsValid = dataBlockId in selectedBlocks;
        if (dataBlockId && blockIsValid) {
          setBlocksSelected(selectedBlocks[dataBlockId]);
        }
      }

      if (!selectedHTML) {
        setErrorUrlNotSelected(true);
      }
    }
  }, []);

  return (
    <BaseModal
      isOpen={isOpen}
      close={onClose}
      title={intl.formatMessage(messages.insertLinkModalTitle)}
      confirmAction={(
        <Button variant="primary" onClick={handleSave} disabled={errorUrlNotSelected}>
          {intl.formatMessage(messages.insertLinkModalButtonSave)}
        </Button>
      )}
    >
      {blockSelected ? (
        <BlockLink path={blockSelected.path} onCloseLink={handleCloseLink} />
      ) : (
        <Tabs
          variant="tabs"
          defaultActiveKey="course-pages"
          id="uncontrolled-tab-example"
          className="mt-3 justify-content-around w-100"
        >
          <Tab
            eventKey="course-pages"
            title={intl.formatMessage(messages.insertLinkModalCoursePagesTabTitle)}
            className="col-12 w-100 tabs-container"
          >
            {errorUrlNotSelected && (
            <Form.Control.Feedback type="invalid" className="mt-4">
              {intl.formatMessage(messages.insertLinkModalUrlNotSelectedErrorMessage)}
            </Form.Control.Feedback>
            )}

            <SearchBlocks
              blocks={blocksList || {}}
              onSearchFilter={handleSearchedBlocks}
              searchInputValue={searchField}
              onBlockSelected={handleSelectedBlock}
            />
            {!blocksSearched && (
              <BlocksList
                blocks={blocksList || {}}
                onBlockSelected={handleSelectedBlock}
              />
            )}
          </Tab>
        </Tabs>
      )}
    </BaseModal>
  );
};

InsertLinkModal.propTypes = {
  courseId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editorRef: PropTypes.shape({
    current: PropTypes.shape({
      selection: PropTypes.shape({
        getContent: PropTypes.func,
        setContent: PropTypes.func,
        getRng: PropTypes.func, // Add this line
        getNode: PropTypes.func, // Add this line
      }),
      getContent: PropTypes.func,
      setContent: PropTypes.func,
      dom: PropTypes.shape({
        create: PropTypes.func,
        getParent: PropTypes.func,
      }),
    }),
  }).isRequired,
};

export default InsertLinkModal;
