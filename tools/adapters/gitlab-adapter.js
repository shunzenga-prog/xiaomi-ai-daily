/**
 * GitLab 平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import { verifyHmacSha256 } from '../lib/utils.js';

export class GitLabAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'gitlab';
    this.description = 'GitLab Webhook 适配器';
    this.secret = config.secret || process.env.GITLAB_SECRET || '';
  }

  async verifySignature(req, rawBody) {
    const token = req.headers['x-gitlab-token'];
    if (!token) {
      return !this.secret;
    }
    // GitLab 使用简单的 token 比较
    return token === this.secret;
  }

  async parseEvent(req) {
    const event = req.headers['x-gitlab-event'];
    const body = req.body;
    const objectKind = body.object_kind;

    const result = {
      platform: 'gitlab',
      event: objectKind || event?.replace('Hook', '').toLowerCase(),
      timestamp: Date.now(),
      raw: body
    };

    // 解析项目信息
    if (body.project) {
      result.project = {
        id: body.project.id,
        name: body.project.name,
        path: body.project.path_with_namespace,
        url: body.project.web_url,
        visibility: body.project.visibility
      };
    }

    // 解析用户信息
    if (body.user) {
      result.user = {
        id: body.user.id,
        name: body.user.name,
        username: body.user.username,
        avatar: body.user.avatar_url
      };
    }

    // 根据事件类型解析
    switch (objectKind) {
      case 'push':
        result.data = this._parsePushEvent(body);
        break;
      case 'merge_request':
        result.data = this._parseMergeRequestEvent(body);
        result.event = 'merge_request';
        break;
      case 'issue':
        result.data = this._parseIssueEvent(body);
        break;
      case 'note':
        result.data = this._parseNoteEvent(body);
        break;
      case 'pipeline':
        result.data = this._parsePipelineEvent(body);
        break;
      case 'job':
        result.data = this._parseJobEvent(body);
        break;
      case 'release':
        result.data = this._parseReleaseEvent(body);
        break;
      case 'wiki_page':
        result.data = this._parseWikiEvent(body);
        break;
      default:
        result.data = body;
    }

    return result;
  }

  _parsePushEvent(body) {
    return {
      ref: body.ref,
      before: body.before,
      after: body.after,
      checkoutSha: body.checkout_sha,
      userName: body.user_name,
      userEmail: body.user_email,
      commits: (body.commits || []).map(c => ({
        id: c.id,
        message: c.message,
        timestamp: c.timestamp,
        url: c.url,
        author: {
          name: c.author?.name,
          email: c.author?.email
        },
        added: c.added || [],
        removed: c.removed || [],
        modified: c.modified || []
      })),
      totalCommitsCount: body.total_commits_count
    };
  }

  _parseMergeRequestEvent(body) {
    const mr = body.object_attributes;
    return {
      id: mr.id,
      iid: mr.iid,
      title: mr.title,
      description: mr.description,
      state: mr.state,
      action: body.object_attributes?.action,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      sourceProjectId: mr.source_project_id,
      targetProjectId: mr.target_project_id,
      author: {
        id: mr.author_id,
        name: body.user?.name
      },
      assignees: body.assignees || [],
      labels: body.labels || [],
      url: mr.url,
      createdAt: mr.created_at,
      updatedAt: mr.updated_at,
      mergedAt: mr.merged_at,
      closedAt: mr.closed_at
    };
  }

  _parseIssueEvent(body) {
    const issue = body.object_attributes;
    return {
      id: issue.id,
      iid: issue.iid,
      title: issue.title,
      description: issue.description,
      state: issue.state,
      action: issue.action,
      labels: (body.labels || []).map(l => ({
        id: l.id,
        title: l.title,
        color: l.color
      })),
      assignees: body.assignees || [],
      author: {
        id: issue.author_id,
        name: body.user?.name
      },
      url: issue.url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at
    };
  }

  _parseNoteEvent(body) {
    const note = body.object_attributes;
    return {
      id: note.id,
      note: note.note,
      noteableType: note.noteable_type, // Issue, MergeRequest, Snippet, Commit
      author: {
        id: note.author_id,
        name: body.user?.name
      },
      url: note.url,
      createdAt: note.created_at
    };
  }

  _parsePipelineEvent(body) {
    const pipeline = body.object_attributes;
    return {
      id: pipeline.id,
      status: pipeline.status,
      stage: pipeline.stage,
      projectName: pipeline.name,
      ref: pipeline.ref,
      sha: pipeline.sha,
      beforeSha: pipeline.before_sha,
      tag: pipeline.tag,
      duration: pipeline.duration,
      url: pipeline.url,
      variables: body.variables || [],
      createdAt: pipeline.created_at,
      finishedAt: pipeline.finished_at
    };
  }

  _parseJobEvent(body) {
    const job = body.object_attributes;
    return {
      id: job.id,
      name: job.name,
      stage: job.stage,
      status: job.status,
      duration: job.duration,
      queueDuration: job.queued_duration,
      ref: job.ref,
      sha: job.sha,
      allowFailure: job.allow_failure,
      url: body.project?.web_url + '/-/jobs/' + job.id
    };
  }

  _parseReleaseEvent(body) {
    const release = body.object_attributes;
    return {
      id: release.id,
      name: release.name,
      tagName: release.tag,
      description: release.description,
      url: release.url,
      createdAt: release.created_at
    };
  }

  _parseWikiEvent(body) {
    const wiki = body.object_attributes;
    return {
      id: wiki.id,
      title: wiki.title,
      content: wiki.content,
      format: wiki.format,
      action: wiki.action,
      url: wiki.url,
      author: {
        id: wiki.author_id,
        name: body.user?.name
      }
    };
  }
}

export default GitLabAdapter;