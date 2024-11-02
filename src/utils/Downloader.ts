/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import fs from 'fs';
import nodeFetch from 'node-fetch';
import { EventEmitter } from 'events';
import os from 'os';
import SevenZip from 'node-7z';
import SevenZipBin from '7zip-bin'

import { getFileHash } from '../utils/Index.js';

export type downloadOptions = {
    url: string,
    path: string,
    length: number,
    folder: string,
    type?: string,
    checksum?: string,
}

export default class download extends EventEmitter {
    async downloadFile(url: string, path: string, fileName: string) {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
        const writer = fs.createWriteStream(path + '/' + fileName);
        const response = await nodeFetch(url);
        let size = response.headers.get('content-length');
        let downloaded = 0;

        return new Promise((resolve: any, reject: any) => {
            response.body.on('data', (chunk) => {
                downloaded += chunk.length;
                this.emit('progress', downloaded, size);
                writer.write(chunk);
            });

            response.body.on('end', () => {
                writer.end();
                resolve();
            });

            response.body.on('error', (err) => {
                this.emit('error', err);
                reject(err);
            });
        })
    }

    async verifyAndDownloadFile(pathFolder: string, fileName: string, url: string, correctChecksum: string): Promise<void> {
        const filePath = `${pathFolder.replace(/\/$/m, '')}/${fileName}`;

        if (fs.existsSync(filePath)) {
            const existingChecksum = await getFileHash(filePath, 'sha256');
            if (existingChecksum !== correctChecksum) {
                fs.unlinkSync(filePath);
                fs.rmSync(pathFolder, { recursive: true, force: true });
            }
        }

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(pathFolder, { recursive: true });
            const downloader = new download();

            downloader.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });

            await downloader.downloadFile(url, pathFolder, fileName);
        }

        const downloadedChecksum = await getFileHash(filePath, 'sha256');
        if (downloadedChecksum !== correctChecksum) {
            throw new Error("Checksum failed");
        }
    }

    async downloadFileMultiple(files: downloadOptions[], size: number, limit: number = 1, timeout: number = 10000) {
        if (limit > files.length) limit = files.length;
        let completed = 0;
        let downloaded = 0;
        let queued = 0;

        let start = new Date().getTime();
        let before = 0;
        let speeds = [];

        let estimated = setInterval(() => {
            let duration = (new Date().getTime() - start) / 1000;
            let loaded = (downloaded - before) * 8;
            if (speeds.length >= 5) speeds = speeds.slice(1);
            speeds.push((loaded / duration) / 8);
            let speed = 0;
            for (let s of speeds) speed += s;
            speed /= speeds.length;
            this.emit("speed", speed);
            let time = (size - downloaded) / (speed);
            this.emit("estimated", time);
            start = new Date().getTime();
            before = downloaded;
        }, 500);

        const downloadNext = async () => {
            if (queued < files.length) {
                let file = files[queued];
                queued++;

                if (!fs.existsSync(file.folder)) fs.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                const writer: any = fs.createWriteStream(file.path, { flags: 'w', mode: 0o777 });

                try {
                    const response = await nodeFetch(file.url, { timeout: timeout });

                    response.body.on('data', (chunk: any) => {
                        downloaded += chunk.length;
                        this.emit('progress', downloaded, size, file.path);
                        writer.write(chunk);
                    });

                    response.body.on('end', () => {
                        writer.end();
                        completed++;
                        downloadNext();
                    });

                } catch (e) {
                    writer.end();
                    completed++;
                    downloadNext();
                    this.emit('error', e);
                }
            }
        };

        while (queued < limit) downloadNext();

        return new Promise((resolve: any) => {
            const interval = setInterval(() => {
                if (completed === files.length) {
                    clearInterval(estimated);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    async checkURL(url: string, timeout = 10000) {
        return await new Promise(async (resolve, reject) => {
            await nodeFetch(url, { method: 'HEAD', timeout: timeout }).then(res => {
                if (res.status === 200) {
                    resolve({
                        size: parseInt(res.headers.get('content-length')),
                        status: res.status
                    })
                }
            })
            reject(false);
        });
    }

    async checkMirror(baseURL: string, mirrors: any) {
        for (let mirror of mirrors) {
            let url = `${mirror}/${baseURL}`;
            let res: any = await this.checkURL(url).then(res => res).catch(err => false);

            if (res?.status == 200) {
                return {
                    url: url,
                    size: res.size,
                    status: res.status
                }
                break;
            } continue;
        }
        return false;
    }

    async extract(filePath: string, destPath: string) {
        if (os.platform() !== 'win32') fs.chmodSync(SevenZipBin.path7za, 0o755);

        await new Promise<void>((resolve, reject) => {
            const extract = SevenZip.extractFull(filePath, destPath, {
                $bin: SevenZipBin.path7za,
                recursive: true,
                $progress: true,
            });

            extract.on('end', () => resolve());
            extract.on('error', (err) => reject(err));
            extract.on('progress', (progress) => {
                if (progress.percent > 0) this.emit('extract', progress.percent);
            });
        });
    }
}