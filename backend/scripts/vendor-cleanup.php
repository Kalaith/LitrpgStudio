<?php
/**
 * Vendor Cleanup Script for Production
 * Removes unnecessary files from vendor directory to reduce size
 */

class VendorCleanup
{
    private $vendorPath;
    private $totalSaved = 0;
    private $filesRemoved = 0;
    private $dirsRemoved = 0;

    // Files and directories to remove from vendor packages
    private $filesToRemove = [
        // Documentation files
        'README.md', 'README.rst', 'README.txt', 'README', 'readme.md',
        'CHANGELOG.md', 'CHANGELOG.rst', 'CHANGELOG.txt', 'CHANGELOG',
        'HISTORY.md', 'HISTORY.rst', 'HISTORY.txt', 'HISTORY',
        'UPGRADE.md', 'UPGRADE.rst', 'UPGRADE.txt', 'UPGRADE',
        'CONTRIBUTING.md', 'CONTRIBUTING.rst', 'CONTRIBUTING.txt',
        'LICENSE.md', 'LICENSE.rst', 'LICENSE.txt', 'LICENSE',
        'COPYING', 'COPYING.txt',

        // Build and development files
        'Makefile', 'makefile', 'GNUmakefile',
        'composer.json', 'composer.lock', 'package.json', 'package-lock.json',
        'phpunit.xml', 'phpunit.xml.dist', 'phpcs.xml', 'phpcs.xml.dist',
        '.travis.yml', '.github', '.circleci',
        'phpstan.neon', 'phpstan.neon.dist',
        'psalm.xml', 'psalm.xml.dist',
        'infection.json', 'infection.json.dist',
        'behat.yml', 'behat.yml.dist',

        // IDE files
        '.idea', '.vscode',

        // Version control
        '.gitignore', '.gitattributes', '.gitmodules',
        '.hgignore', '.hgtags',

        // Docker files
        'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
        '.dockerignore',

        // Other development files
        'Vagrantfile', '.editorconfig', '.scrutinizer.yml',
        'appveyor.yml', '.codeclimate.yml'
    ];

    private $dirsToRemove = [
        // Version control directories
        '.git', '.hg', '.svn', '.bzr',

        // Development directories
        'tests', 'test', 'Test', 'Tests',
        'spec', 'specs', 'Spec', 'Specs',
        'example', 'examples', 'Example', 'Examples',
        'sample', 'samples', 'Sample', 'Samples',
        'demo', 'demos', 'Demo', 'Demos',
        'doc', 'docs', 'Doc', 'Docs',
        'documentation', 'Documentation',

        // Build directories
        'build', 'Build',
        'dist', 'Dist',
        'coverage', 'Coverage',

        // IDE directories
        '.idea', '.vscode',

        // CI directories
        '.github', '.travis', '.circleci'
    ];

    public function __construct($vendorPath = null)
    {
        $this->vendorPath = $vendorPath ?: __DIR__ . '/../vendor';
    }

    public function run()
    {
        if (!is_dir($this->vendorPath)) {
            echo "Vendor directory not found: {$this->vendorPath}\n";
            return false;
        }

        echo "Starting vendor cleanup...\n";
        echo "Vendor path: {$this->vendorPath}\n\n";

        $sizeBefore = $this->getDirectorySize($this->vendorPath);
        echo "Size before cleanup: " . $this->formatBytes($sizeBefore) . "\n";

        $this->cleanupVendorDirectory();

        $sizeAfter = $this->getDirectorySize($this->vendorPath);
        echo "\nSize after cleanup: " . $this->formatBytes($sizeAfter) . "\n";
        echo "Space saved: " . $this->formatBytes($sizeBefore - $sizeAfter) . "\n";
        echo "Files removed: {$this->filesRemoved}\n";
        echo "Directories removed: {$this->dirsRemoved}\n";

        return true;
    }

    private function cleanupVendorDirectory()
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->vendorPath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $file) {
            $relativePath = str_replace($this->vendorPath . DIRECTORY_SEPARATOR, '', $file->getPathname());

            if ($file->isDir()) {
                $dirName = $file->getBasename();
                if ($this->shouldRemoveDirectory($dirName, $relativePath)) {
                    $this->removeDirectory($file->getPathname());
                }
            } else {
                $fileName = $file->getBasename();
                if ($this->shouldRemoveFile($fileName, $relativePath)) {
                    $this->removeFile($file->getPathname());
                }
            }
        }
    }

    private function shouldRemoveFile($fileName, $relativePath)
    {
        // Don't remove files in root vendor directory
        if (strpos($relativePath, DIRECTORY_SEPARATOR) === false) {
            return false;
        }

        return in_array($fileName, $this->filesToRemove) ||
               $this->matchesPattern($fileName, [
                   '*.md', '*.rst', '*.txt',
                   '.travis*', '.scrutinizer*', '.codeclimate*',
                   'appveyor*', 'Dockerfile*'
               ]);
    }

    private function shouldRemoveDirectory($dirName, $relativePath)
    {
        // Don't remove vendor root or package root directories
        $pathParts = explode(DIRECTORY_SEPARATOR, $relativePath);
        if (count($pathParts) <= 2) {
            return false;
        }

        return in_array($dirName, $this->dirsToRemove);
    }

    private function matchesPattern($fileName, $patterns)
    {
        foreach ($patterns as $pattern) {
            if (fnmatch($pattern, $fileName)) {
                return true;
            }
        }
        return false;
    }

    private function removeFile($filePath)
    {
        if (is_file($filePath) && is_writable($filePath)) {
            $size = filesize($filePath);
            if (unlink($filePath)) {
                $this->totalSaved += $size;
                $this->filesRemoved++;
                echo "Removed file: " . basename($filePath) . "\n";
            }
        }
    }

    private function removeDirectory($dirPath)
    {
        if (is_dir($dirPath) && is_writable($dirPath)) {
            $size = $this->getDirectorySize($dirPath);
            if ($this->deleteDirectory($dirPath)) {
                $this->totalSaved += $size;
                $this->dirsRemoved++;
                echo "Removed directory: " . basename($dirPath) . "\n";
            }
        }
    }

    private function deleteDirectory($dir)
    {
        if (!is_dir($dir)) {
            return false;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isDir()) {
                rmdir($file->getPathname());
            } else {
                unlink($file->getPathname());
            }
        }

        return rmdir($dir);
    }

    private function getDirectorySize($directory)
    {
        $size = 0;
        if (is_dir($directory)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        }
        return $size;
    }

    private function formatBytes($size, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $base = log($size, 1024);
        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $units[floor($base)];
    }
}

// Run the cleanup if this script is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $cleanup = new VendorCleanup();
    $cleanup->run();
}