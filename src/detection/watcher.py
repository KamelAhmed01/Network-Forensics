import time
import logging
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger(__name__)

class JsonFileHandler(FileSystemEventHandler):
    """Handler for Suricata Eve JSON file changes"""

    def __init__(self, processor, filepath):
        """Initialize handler

        Args:
            processor: Callback function to process file changes
            filepath (str): Path to watch for changes
        """
        self.processor = processor
        self.filepath = filepath
        self.last_position = 0

    def on_modified(self, event):
        """Handle file modification events

        Args:
            event: FileSystemEvent object
        """
        if not event.is_directory and event.src_path == self.filepath:
            self.process_new_lines()

    def process_new_lines(self):
        """Process new lines in the file since last read"""
        try:
            # Check if file exists
            if not os.path.exists(self.filepath):
                logger.warning(f"File {self.filepath} does not exist")
                return

            # Open file and seek to last position
            with open(self.filepath, 'r') as f:
                f.seek(0, 2)  # Seek to end to get file size
                file_size = f.tell()

                # If file was truncated, reset position
                if file_size < self.last_position:
                    logger.warning(f"File {self.filepath} was truncated, resetting position")
                    self.last_position = 0

                # Seek to last position
                f.seek(self.last_position)

                # Read and process new lines
                line_count = 0
                for line in f:
                    self.processor(line)
                    line_count += 1

                # Update last position
                self.last_position = f.tell()

                if line_count > 0:
                    logger.debug(f"Processed {line_count} new lines")

        except Exception as e:
            logger.error(f"Error processing file {self.filepath}: {e}")

class FileWatcher:
    """Watches a file for changes and processes new content"""

    def __init__(self, filepath, processor, polling_interval=1.0):
        """Initialize watcher

        Args:
            filepath (str): Path to file to watch
            processor: Function to process new lines
            polling_interval (float): Observer polling interval in seconds
        """
        self.filepath = os.path.abspath(filepath)
        self.directory = os.path.dirname(self.filepath)
        self.processor = processor
        self.polling_interval = polling_interval
        self.observer = None
        self.handler = None

    def start(self):
        """Start watching file for changes"""
        logger.info(f"Starting to watch {self.filepath}")

        # Create directory if it doesn't exist
        if not os.path.exists(self.directory):
            logger.warning(f"Directory {self.directory} does not exist, creating")
            os.makedirs(self.directory)

        # Create file if it doesn't exist
        if not os.path.exists(self.filepath):
            logger.warning(f"File {self.filepath} does not exist, creating empty file")
            open(self.filepath, 'a').close()

        # Create observer and handler
        self.handler = JsonFileHandler(self.processor, self.filepath)
        self.observer = Observer(timeout=self.polling_interval)
        self.observer.schedule(self.handler, path=self.directory, recursive=False)

        # Start observer
        self.observer.start()
        logger.info(f"File watcher started for {self.filepath}")

    def stop(self):
        """Stop watching file"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("File watcher stopped")
