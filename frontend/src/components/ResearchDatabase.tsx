import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Tags,
  Link2,
  FileText,
  Star,
  Archive,
  Grid,
  List,
  Settings,
  Download,
  Upload,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  BookOpen,
  Quote,
  Image,
  Video,
  Music,
  File,
  ExternalLink,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import type {
  ResearchDatabase as ResearchDatabaseType,
  ResearchSource,
  ResearchCollection,
  SourceType,
  CollectionCategory,
  AnnotationType,
  LinkType
} from '../types/research';

interface ResearchDatabaseProps {
  className?: string;
}

export const ResearchDatabase: React.FC<ResearchDatabaseProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'collections' | 'links' | 'analytics'>('sources');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);

  // Mock data for demonstration
  const mockSources: ResearchSource[] = [
    {
      id: '1',
      title: 'Medieval Combat Techniques',
      type: 'book',
      content: {
        summary: 'Comprehensive guide to historical medieval combat techniques and weapons.',
        keyPoints: ['Sword fighting techniques', 'Armor types', 'Battle formations'],
        excerpts: [],
        media: [],
        structure: { headings: [], sections: [], references: [], figures: [], tables: [] },
        readingTime: 45,
        wordCount: 15000,
        language: 'en',
        quality: {
          credibility: 9,
          accuracy: 8,
          relevance: 10,
          completeness: 8,
          freshness: 6,
          overallScore: 8.2,
          issues: []
        }
      },
      metadata: {
        author: ['John Smith'],
        publishDate: new Date('2020-01-15'),
        pages: { start: 1, end: 300, total: 300 },
        accessDate: new Date(),
        format: 'PDF'
      },
      annotations: [],
      links: [],
      citations: [],
      attachments: [],
      tags: ['combat', 'medieval', 'weapons'],
      collections: ['worldbuilding'],
      favorited: true,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date()
    },
    {
      id: '2',
      title: 'Magic System Design Principles',
      type: 'article',
      content: {
        summary: 'Analysis of effective magic system design in fantasy literature.',
        keyPoints: ['Consistency rules', 'Cost mechanics', 'Power scaling'],
        excerpts: [],
        media: [],
        structure: { headings: [], sections: [], references: [], figures: [], tables: [] },
        readingTime: 15,
        wordCount: 5000,
        language: 'en',
        quality: {
          credibility: 8,
          accuracy: 9,
          relevance: 10,
          completeness: 7,
          freshness: 9,
          overallScore: 8.6,
          issues: []
        }
      },
      metadata: {
        author: ['Jane Doe'],
        publishDate: new Date('2023-06-20'),
        url: 'https://example.com/magic-systems',
        accessDate: new Date(),
        format: 'HTML'
      },
      annotations: [],
      links: [],
      citations: [],
      attachments: [],
      tags: ['magic', 'design', 'fantasy'],
      collections: ['magic_systems'],
      favorited: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date()
    }
  ];

  const mockCollections: ResearchCollection[] = [
    {
      id: 'worldbuilding',
      name: 'World Building',
      description: 'Resources for creating fictional worlds',
      category: 'worldbuilding',
      sources: ['1'],
      tags: ['world', 'setting', 'environment'],
      color: '#3B82F6',
      icon: '🌍',
      visibility: 'private',
      collaborators: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'magic_systems',
      name: 'Magic Systems',
      description: 'Research on magical systems and their implementation',
      category: 'magic_systems',
      sources: ['2'],
      tags: ['magic', 'rules', 'mechanics'],
      color: '#8B5CF6',
      icon: '✨',
      visibility: 'private',
      collaborators: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const filteredSources = useMemo(() => {
    return mockSources.filter(source => {
      const matchesSearch = searchQuery === '' ||
        source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.content.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCollection = selectedCollection === null ||
        source.collections.includes(selectedCollection);

      return matchesSearch && matchesCollection;
    });
  }, [mockSources, searchQuery, selectedCollection]);

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'book': return BookOpen;
      case 'article': return FileText;
      case 'website': return ExternalLink;
      case 'video': return Video;
      case 'image': return Image;
      case 'podcast': return Music;
      case 'quote': return Quote;
      default: return File;
    }
  };

  const SourceCard = ({ source }: { source: ResearchSource }) => {
    const IconComponent = getSourceIcon(source.type);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedSource(source)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <IconComponent size={18} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase">{source.type}</span>
          </div>
          <div className="flex items-center space-x-1">
            {source.favorited && <Star size={14} className="text-yellow-500 fill-current" />}
            {source.archived && <Archive size={14} className="text-gray-400" />}
          </div>
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{source.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{source.content.summary}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <User size={12} />
            <span>{source.metadata.author.join(', ')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>{source.content.readingTime}min</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {source.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {tag}
            </span>
          ))}
          {source.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{source.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Quality: {source.content.quality.overallScore.toFixed(1)}/10</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Calendar size={12} />
            <span>{source.metadata.publishDate?.toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const SourceList = ({ source }: { source: ResearchSource }) => {
    const IconComponent = getSourceIcon(source.type);

    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setSelectedSource(source)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <IconComponent size={20} className="text-gray-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{source.title}</h3>
                <span className="text-xs text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                  {source.type}
                </span>
                {source.favorited && <Star size={14} className="text-yellow-500 fill-current" />}
              </div>
              <p className="text-sm text-gray-600 mt-1">{source.content.summary}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>By {source.metadata.author.join(', ')}</span>
                <span>{source.content.readingTime}min read</span>
                <span>Quality: {source.content.quality.overallScore.toFixed(1)}/10</span>
                <span>{source.metadata.publishDate?.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-wrap gap-1">
              {source.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const CollectionCard = ({ collection }: { collection: ResearchCollection }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedCollection(collection.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{collection.icon}</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: collection.color }}></div>
        </div>
        <div className="flex items-center space-x-1">
          {collection.visibility === 'public' ? (
            <Eye size={14} className="text-gray-400" />
          ) : (
            <EyeOff size={14} className="text-gray-400" />
          )}
          <span className="text-xs text-gray-500">{collection.sources.length} sources</span>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">{collection.name}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>

      <div className="flex flex-wrap gap-1">
        {collection.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {tag}
          </span>
        ))}
        {collection.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            +{collection.tags.length - 3} more
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-none border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Research Database</h1>
            <p className="text-sm text-gray-600">Organize and link research materials to your story elements</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Source</span>
            </button>
            <button className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <Upload size={16} />
              <span>Import</span>
            </button>
            <button className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-none border-b border-gray-200 bg-white px-6">
        <div className="flex space-x-8">
          {[
            { id: 'sources', label: 'Sources', count: mockSources.length },
            { id: 'collections', label: 'Collections', count: mockCollections.length },
            { id: 'links', label: 'Links', count: 12 },
            { id: 'analytics', label: 'Analytics', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="flex-none w-64 border-r border-gray-200 bg-gray-50 p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search research..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Collections Filter */}
          {activeTab === 'sources' && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Collections</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    selectedCollection === null ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Sources ({mockSources.length})
                </button>
                {mockCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center space-x-2 ${
                      selectedCollection === collection.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{collection.icon}</span>
                    <span>{collection.name} ({collection.sources.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              <Plus size={16} />
              <span>Add Collection</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              <Tags size={16} />
              <span>Manage Tags</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'sources' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {filteredSources.length} sources
                    {selectedCollection && (
                      <span> in {mockCollections.find(c => c.id === selectedCollection)?.name}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      showFilters ? 'bg-blue-100 text-blue-700' : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter size={16} />
                    <span>Filters</span>
                  </button>
                  <div className="flex border border-gray-300 rounded-md">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 border-l border-gray-300 transition-colors ${
                        viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredSources.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredSources.map((source) => (
                      <SourceList key={source.id} source={source} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-600">{mockCollections.length} collections</span>
                <button
                  onClick={() => setShowAddCollection(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>New Collection</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="p-6 text-center text-gray-500">
              <Link2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Research links will be displayed here</p>
              <p className="text-sm">Connect your sources to story elements</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6 text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Analytics dashboard will be displayed here</p>
              <p className="text-sm">Track research usage and insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Source Detail Modal */}
      <AnimatePresence>
        {selectedSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSource(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedSource.title}</h2>
                  <p className="text-sm text-gray-600">By {selectedSource.metadata.author.join(', ')}</p>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{selectedSource.content.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Key Points</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedSource.content.keyPoints.map((point, index) => (
                        <li key={index} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSource.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 text-gray-700 capitalize">{selectedSource.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reading Time:</span>
                        <span className="ml-2 text-gray-700">{selectedSource.content.readingTime} minutes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Word Count:</span>
                        <span className="ml-2 text-gray-700">{selectedSource.content.wordCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality Score:</span>
                        <span className="ml-2 text-gray-700">{selectedSource.content.quality.overallScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};