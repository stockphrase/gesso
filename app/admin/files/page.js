"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { getActiveCourse } from "@/utils/course";

export default function AdminFilesPage() {
  const [folders, setFolders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [folderFiles, setFolderFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [permission, setPermission] = useState("1");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      const course = getActiveCourse();
      if (!course) {
        router.push("/courses");
        return;
      }

      setCourseId(course.id);
      await loadFolders(course.id);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFolders(cId) {
    const { data } = await supabase
      .from("file_folders")
      .select("*")
      .eq("course_id", cId)
      .order("name");
    setFolders(data || []);
  }

  async function loadFolderFiles(folderId) {
    if (folderFiles[folderId]) return;
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("folder_id", folderId)
      .order("name");
    setFolderFiles((prev) => ({ ...prev, [folderId]: data || [] }));
  }

  async function toggleFolder(folderId) {
    if (expanded === folderId) {
      setExpanded(null);
    } else {
      setExpanded(folderId);
      await loadFolderFiles(folderId);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploading(true);
    setResult(null);
    setError(null);

    const file = e.target.elements.zipfile.files[0];
    if (!file) {
      setError("Please select a ZIP file.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_id", courseId);
    formData.append("permission_level", permission);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Upload failed.");
      setUploading(false);
      return;
    }

    setResult(data);
    await loadFolders(courseId);
    setFolderFiles({});
    setUploading(false);
    e.target.reset();
  }

  async function handleDeleteFile(fileId, folderId) {
    const { data: file } = await supabase
      .from("files")
      .select("storage_path")
      .eq("id", fileId)
      .single();
    if (file)
      await supabase.storage.from("course-files").remove([file.storage_path]);
    await supabase.from("files").delete().eq("id", fileId);
    setFolderFiles((prev) => ({
      ...prev,
      [folderId]: prev[folderId].filter((f) => f.id !== fileId),
    }));
  }

  async function handleDeleteFolder(folderId) {
    const files = folderFiles[folderId] || [];
    const paths = files.map((f) => f.storage_path);
    if (paths.length > 0)
      await supabase.storage.from("course-files").remove(paths);
    await supabase.from("file_folders").delete().eq("id", folderId);
    setFolders(folders.filter((f) => f.id !== folderId));
    setFolderFiles((prev) => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
    if (expanded === folderId) setExpanded(null);
  }

  async function handleUpdatePermission(folderId, newLevel) {
    await supabase
      .from("file_folders")
      .update({ permission_level: parseInt(newLevel) })
      .eq("id", folderId);
    setFolders(
      folders.map((f) =>
        f.id === folderId ? { ...f, permission_level: parseInt(newLevel) } : f,
      ),
    );
  }

  const permissionLabel = {
    1: "Admin + Tutor + Student",
    2: "Admin + Tutor",
    3: "Admin only",
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" />
      <div className="px-8 py-10 border-b border-gray-300">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Admin
        </p>
        <h2 className="text-3xl font-black text-black tracking-tight">FILES</h2>
      </div>
      <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">
            Upload ZIP Archive
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
                ZIP File
              </label>
              <label className="flex items-center justify-between border border-black p-3 w-full cursor-pointer hover:bg-gray-50">
                <span
                  className="text-xs font-bold tracking-widest uppercase text-gray-500"
                  id="zipfile-label"
                >
                  Choose ZIP file
                </span>
                <span className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors">
                  Browse
                </span>
                <input
                  type="file"
                  name="zipfile"
                  accept=".zip"
                  required
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    document.getElementById("zipfile-label").textContent = f
                      ? f.name
                      : "Choose ZIP file";
                  }}
                />
              </label>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
                Permission Level
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="border border-black p-3 w-full text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="1">1 — Admin + Tutor + Student</option>
                <option value="2">2 — Admin + Tutor</option>
                <option value="3">3 — Admin only</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {result && (
              <div className="border border-black bg-white p-4 text-sm">
                <p className="font-bold text-black mb-1">Upload complete</p>
                <p className="text-gray-600">
                  {result.folders_created} folder(s) created,{" "}
                  {result.files_uploaded} file(s) uploaded
                </p>
                {result.errors?.length > 0 && (
                  <ul className="mt-2 text-red-600">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={uploading}
              className="bg-black text-white p-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {uploading ? "UPLOADING..." : "UPLOAD ZIP"}
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">
            Folders
          </h3>
          {folders.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No folders yet. Upload a ZIP to create them.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-200">
              {folders.map((folder) => (
                <div key={folder.id}>
                  <div className="py-4 flex items-center justify-between gap-4">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="text-sm font-bold text-black hover:underline text-left flex items-center gap-2"
                    >
                      <FontAwesomeIcon
                        icon={expanded === folder.id ? faFolderOpen : faFolder}
                        className="w-4 h-4"
                      />
                      {folder.name}
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={folder.permission_level}
                        onChange={(e) =>
                          handleUpdatePermission(folder.id, e.target.value)
                        }
                        className="text-xs border border-gray-300 p-1 text-gray-600"
                      >
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                      </select>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                  {expanded === folder.id && (
                    <div className="pb-4 pl-4 flex flex-col gap-2">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                        {permissionLabel[folder.permission_level]}
                      </p>
                      {!folderFiles[folder.id] ? (
                        <p className="text-xs text-gray-400">Loading...</p>
                      ) : folderFiles[folder.id].length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No files in this folder.
                        </p>
                      ) : (
                        folderFiles[folder.id].map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between text-sm border border-gray-100 bg-white p-2"
                          >
                            <span className="text-gray-700">{file.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {file.size
                                  ? `${(file.size / 1024).toFixed(1)} KB`
                                  : ""}
                              </span>
                              <button
                                onClick={() =>
                                  handleDeleteFile(file.id, folder.id)
                                }
                                className="text-xs text-red-500 hover:text-red-700 font-bold"
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
