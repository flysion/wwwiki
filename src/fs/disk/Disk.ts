class Disk implements FileSystem
{
    /**
     * 获取目录下边的文件列表
     *
     * @param {string} path
     * @param {ListDirOptions} options
     * @param {(data: Array) => void} callback
     */
    listdir(path: string, options?: ListDirOptions, callback?: (data: Array) => void)
    {

    }

    /**
     * 删除目录
     *
     * @param {string} path
     * @param {RmDirOptions} options
     * @param {() => void} callback
     */
    rmdir(path: string, options?: RmDirOptions, callback?: () => void)
    {

    }

    /**
     * 创建目录
     *
     * @param {string} path
     * @param {MkDirOptions} options
     * @param {() => void} callback
     */
    mkdir(path: string, options?: MkDirOptions, callback?: () => void)
    {

    }

    /**
     * 重命名目录
     * @param {string} oldPath
     * @param {string} newPpath
     * @param {() => void} callback
     */
    renameDir(oldPath: string, newPpath: string, callback?: () => void)
    {

    }

    /**
     * 写文件
     *
     * @param {string} path
     * @param {string} content
     * @param {WriteFileOptions} options
     * @param {() => void} callback
     */
    writeFile(path: string, content: string, options?: WriteFileOptions, callback?: () => void)
    {

    }

    /**
     * 读文件
     *
     * @param {string} path
     * @param {ReadFileOptions} options
     * @param {(content: string) => void} callback
     */
    readFile(path: string, options?: ReadFileOptions, callback?: (content: string) => void)
    {

    }

    /**
     * 重命名文件
     *
     * @param {string} oldPath
     * @param {string} newPpath
     * @param {() => void} callback
     */
    renameFile(oldPath: string, newPpath: string, callback?: () => void)
    {

    }

    /**
     * 删除文件
     *
     * @param {string} path
     * @param {() => void} callback
     */
    unlink(path: string, callback?: () => void)
    {

    }
}