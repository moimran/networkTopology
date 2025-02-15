import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaFolder, 
  FaFile, 
  FaTrash, 
  FaPlus, 
  FaArrowLeft,
  FaFileImage,
  FaFileAlt,
  FaFileCode,
  FaFilePdf,
  FaFileArchive,
  FaFileAudio,
  FaFileVideo,
  FaSpinner
} from 'react-icons/fa';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Browser-compatible path utilities
const pathUtils = {
  join: (...parts) => {
    return parts
      .map((part, index) => {
        if (index === 0) return part.replace(/\/*$/, '');
        return part.replace(/^\/+|\/+$/g, '');
      })
      .filter(x => x.length)
      .join('/');
  },
  dirname: (path) => {
    return path.replace(/\\/g, '/').replace(/\/[^/]*$/, '') || '/';
  }
};

const ExplorerContainer = styled.div`
  height: 100vh;
  background-color: ${props => props.$isDarkMode ? '#1a1a1a' : '#ffffff'};
  color: ${props => props.$isDarkMode ? '#ffffff' : '#000000'};
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: ${props => props.$isDarkMode ? '#2d2d2d' : '#f5f5f5'};
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PathBar = styled.div`
  background-color: ${props => props.$isDarkMode ? '#2d2d2d' : '#f5f5f5'};
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 10px;
  overflow-y: auto;
  flex-grow: 1;
  background-color: ${props => props.$isDarkMode ? '#1a1a1a' : '#ffffff'};
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background-color: ${props => props.$isDarkMode ? '#404040' : '#e0e0e0'};
  color: ${props => props.$isDarkMode ? '#ffffff' : '#000000'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background-color: ${props => props.$isDarkMode ? '#505050' : '#d0d0d0'};
  }
`;

const DeleteSelectedButton = styled(ActionButton)`
  background-color: ${props => props.$isDarkMode ? '#662222' : '#ffebee'};
  color: ${props => props.$isDarkMode ? '#ffffff' : '#d32f2f'};

  &:hover:not(:disabled) {
    background-color: ${props => props.$isDarkMode ? '#882222' : '#ffcdd2'};
  }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  background-color: ${props => 
    props.$selected 
      ? (props.$isDarkMode ? '#2c5282' : '#e3f2fd')
      : (props.$isDarkMode ? '#2d2d2d' : '#ffffff')
  };
  color: ${props => props.$isDarkMode ? '#ffffff' : '#000000'};
  transition: background-color 0.2s ease;
  gap: 12px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => 
      props.$selected
        ? (props.$isDarkMode ? '#2c5282' : '#e3f2fd')
        : (props.$isDarkMode ? '#363636' : '#f5f5f5')
    };
  }

  svg {
    color: ${props => props.$isDirectory ? '#2196f3' : (props.$isDarkMode ? '#aaaaaa' : '#666666')};
    flex-shrink: 0;
  }
`;

const ItemName = styled.div`
  flex-grow: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemSize = styled.div`
  color: ${props => props.$isDarkMode ? '#aaaaaa' : '#666666'};
  font-size: 13px;
  min-width: 70px;
  text-align: right;
  flex-shrink: 0;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => props.$isDarkMode ? '#2d2d2d' : '#ffffff'};
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 300px;

  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0 20px 0;
  border-radius: 6px;
  border: 1px solid ${props => props.$isDarkMode ? '#404040' : '#ddd'};
  background-color: ${props => props.$isDarkMode ? '#1a1a1a' : '#ffffff'};
  color: ${props => props.$isDarkMode ? '#ffffff' : '#000000'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const ErrorMessage = styled.div`
  color: ${props => props.$isDarkMode ? '#ff6b6b' : '#dc3545'};
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
  display: ${props => props.$visible ? 'block' : 'none'};
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: ${props => props.$visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${props => props.$isDarkMode ? '#aaaaaa' : '#666666'};
  
  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${props => props.$isDarkMode ? '#aaaaaa' : '#666666'};
  text-align: center;
  gap: 12px;

  svg {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

// Helper function to get appropriate icon for file type
function getFileIcon(file) {
  if (!file || file.isDirectory) return FaFolder;
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'];
  const docExts = ['txt', 'md', 'doc', 'docx', 'odt'];
  const pdfExts = ['pdf'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac'];
  const videoExts = ['mp4', 'avi', 'mkv', 'mov'];

  // Handle case where extension might be undefined
  const ext = (file.extension || '').toLowerCase();
  
  if (imageExts.includes(ext)) return FaFileImage;
  if (codeExts.includes(ext)) return FaFileCode;
  if (docExts.includes(ext)) return FaFileAlt;
  if (pdfExts.includes(ext)) return FaFilePdf;
  if (archiveExts.includes(ext)) return FaFileArchive;
  if (audioExts.includes(ext)) return FaFileAudio;
  if (videoExts.includes(ext)) return FaFileVideo;
  
  return FaFile;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function FileExplorer() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState('');
  const [homePath, setHomePath] = useState('');
  const [items, setItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const fetchInitialPath = async () => {
      try {
        setError('');
        setIsLoading(true);
        const response = await axios.get('/networkmap/api/home-path');
        const path = response.data.path;
        setHomePath(path);
        
        // If we have a lastPath from the editor, use that, otherwise use home path
        const initialPath = location.state?.lastPath || path;
        setCurrentPath(initialPath);
      } catch (error) {
        console.error('Error fetching home path:', error.response?.data?.error || error.message);
        setError(error.response?.data?.error || error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPath();
  }, [location.state?.lastPath]); // Re-run when lastPath changes

  useEffect(() => {
    if (currentPath) {
      fetchItems(currentPath);
    }
  }, [currentPath]);

  const fetchItems = async (path) => {
    if (!path) return;
    
    try {
      setError('');
      setIsLoading(true);
      const encodedPath = encodeURIComponent(path);
      const response = await axios.get('/networkmap/api/list-dir', {
        params: { path: encodedPath }
      });
      const filteredItems = response.data.filter(item => !item.name.startsWith('.'));
      setItems(filteredItems);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentPath === homePath) return;
    const parentPath = pathUtils.dirname(currentPath);
    if (!parentPath.startsWith(homePath)) {
      setCurrentPath(homePath);
    } else {
      setCurrentPath(parentPath);
    }
  };

  const handleItemClick = (item) => {
    if (item.isDirectory) {
      setCurrentPath(pathUtils.join(currentPath, item.name));
      setSelectedItems(new Set());
    } else if (item.name.endsWith('.json')) {
      const filePath = pathUtils.join(currentPath, item.name);
      navigate(`/editor?configFile=${encodeURIComponent(filePath)}`);
    }
  };

  const toggleItemSelection = (e, item) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.name)) {
      newSelected.delete(item.name);
    } else {
      newSelected.add(item.name);
    }
    setSelectedItems(newSelected);
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await axios.post('/networkmap/api/files', {
        path: currentPath,
        name: newItemName.trim(),
        type: createType
      });
      setShowCreateModal(false);
      setNewItemName('');
      fetchItems(currentPath);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      console.error('Error creating item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      setError('');
      setIsLoading(true);
      await axios.delete(`/networkmap/api/files`, {
        data: { path: pathUtils.join(currentPath, item.name) }
      });
      fetchItems(currentPath);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      console.error('Error deleting item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      setError('');
      setIsLoading(true);
      
      for (const itemName of selectedItems) {
        await axios.delete(`/networkmap/api/files`, {
          data: { path: pathUtils.join(currentPath, itemName) }
        });
      }
      
      setSelectedItems(new Set());
      fetchItems(currentPath);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      console.error('Error deleting items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ExplorerContainer $isDarkMode={isDarkMode}>
      <Header>
        <ActionButton 
          $isDarkMode={isDarkMode} 
          onClick={handleBack}
          disabled={isLoading || currentPath === homePath}
        >
          <FaArrowLeft /> Back
        </ActionButton>
        <ActionButton 
          $isDarkMode={isDarkMode}
          onClick={() => {
            setCreateType('directory');
            setShowCreateModal(true);
          }}
          disabled={isLoading}
        >
          <FaPlus /> New Folder
        </ActionButton>
        <ActionButton 
          $isDarkMode={isDarkMode}
          onClick={() => {
            setCreateType('file');
            setShowCreateModal(true);
          }}
          disabled={isLoading}
        >
          <FaPlus /> New File
        </ActionButton>
        {selectedItems.size > 0 && (
          <DeleteSelectedButton
            $isDarkMode={isDarkMode}
            onClick={handleDeleteSelected}
            disabled={isLoading}
          >
            <FaTrash /> Delete Selected ({selectedItems.size})
          </DeleteSelectedButton>
        )}
      </Header>

      <PathBar $isDarkMode={isDarkMode}>{currentPath}</PathBar>

      <ErrorMessage $isDarkMode={isDarkMode} $visible={!!error}>
        {error}
      </ErrorMessage>

      <LoadingSpinner $visible={isLoading} $isDarkMode={isDarkMode}>
        <FaSpinner size={32} />
      </LoadingSpinner>

      {!isLoading && items.length === 0 && !error && (
        <EmptyState $isDarkMode={isDarkMode}>
          <FaFolder size={48} />
          <div>This folder is empty</div>
          <div>Create a new file or folder to get started</div>
        </EmptyState>
      )}

      {!isLoading && (
        <ItemsContainer $isDarkMode={isDarkMode}>
          {items.map((item, index) => {
            const FileIcon = getFileIcon(item);
            return (
              <Item 
                key={index} 
                onClick={() => !isLoading && handleItemClick(item)}
                $isDarkMode={isDarkMode}
                $selected={selectedItems.has(item.name)}
                $isDirectory={item.isDirectory}
              >
                <Checkbox
                  checked={selectedItems.has(item.name)}
                  onChange={(e) => toggleItemSelection(e, item)}
                  onClick={(e) => e.stopPropagation()}
                />
                <FileIcon size={18} />
                <ItemName>{item.name}</ItemName>
                {!item.isDirectory && (
                  <ItemSize $isDarkMode={isDarkMode}>
                    {formatSize(item.size)}
                  </ItemSize>
                )}
              </Item>
            );
          })}
        </ItemsContainer>
      )}

      {showCreateModal && (
        <Modal $isDarkMode={isDarkMode}>
          <h3>Create New {createType === 'directory' ? 'Folder' : 'File'}</h3>
          <Input
            $isDarkMode={isDarkMode}
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Enter ${createType} name`}
            disabled={isLoading}
            autoFocus
          />
          <ButtonGroup>
            <ActionButton 
              $isDarkMode={isDarkMode} 
              onClick={() => setShowCreateModal(false)}
              disabled={isLoading}
            >
              Cancel
            </ActionButton>
            <ActionButton 
              $isDarkMode={isDarkMode} 
              onClick={handleCreate}
              disabled={isLoading}
            >
              Create
            </ActionButton>
          </ButtonGroup>
        </Modal>
      )}
    </ExplorerContainer>
  );
}

export default FileExplorer;
