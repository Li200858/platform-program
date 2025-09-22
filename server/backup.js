const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class FileBackup {
  constructor() {
    this.uploadsDir = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/uploads' : 'uploads';
    this.backupDir = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/backups' : 'backups';
  }

  // 创建备份
  async createBackup() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `uploads-backup-${timestamp}.tar.gz`);

      return new Promise((resolve, reject) => {
        exec(`tar -czf ${backupFile} -C ${path.dirname(this.uploadsDir)} ${path.basename(this.uploadsDir)}`, (error, stdout, stderr) => {
          if (error) {
            console.error('备份创建失败:', error);
            reject(error);
          } else {
            console.log('备份创建成功:', backupFile);
            resolve(backupFile);
          }
        });
      });
    } catch (error) {
      console.error('备份过程出错:', error);
      throw error;
    }
  }

  // 恢复备份
  async restoreBackup(backupFile) {
    try {
      if (!fs.existsSync(backupFile)) {
        throw new Error('备份文件不存在');
      }

      return new Promise((resolve, reject) => {
        exec(`tar -xzf ${backupFile} -C ${path.dirname(this.uploadsDir)}`, (error, stdout, stderr) => {
          if (error) {
            console.error('备份恢复失败:', error);
            reject(error);
          } else {
            console.log('备份恢复成功');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('恢复过程出错:', error);
      throw error;
    }
  }

  // 列出所有备份
  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('uploads-backup-') && file.endsWith('.tar.gz'))
        .sort()
        .reverse();
    } catch (error) {
      console.error('列出备份失败:', error);
      return [];
    }
  }

  // 清理旧备份（保留最近5个）
  cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      if (backups.length > 5) {
        const toDelete = backups.slice(5);
        toDelete.forEach(backup => {
          const backupPath = path.join(this.backupDir, backup);
          fs.unlinkSync(backupPath);
          console.log('删除旧备份:', backup);
        });
      }
    } catch (error) {
      console.error('清理备份失败:', error);
    }
  }
}

module.exports = FileBackup;
