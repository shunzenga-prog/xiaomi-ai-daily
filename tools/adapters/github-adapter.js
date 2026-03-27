/**
 * GitHub 平台适配器
 */

import { BaseAdapter } from './base-adapter.js';
import { verifyHmacSha256 } from '../lib/utils.js';

export class GitHubAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'github';
    this.description = 'GitHub Webhook 适配器';
    this.secret = config.secret || process.env.GITHUB_SECRET || '';
  }

  async verifySignature(req, rawBody) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      return !this.secret; // 如果没有配置密钥，则跳过验证
    }
    return verifyHmacSha256(rawBody, signature, this.secret);
  }

  async parseEvent(req) {
    const event = req.headers['x-github-event'];
    const body = req.body;
    const action = body.action;

    // 构建标准化事件
    const result = {
      platform: 'github',
      event,
      action,
      timestamp: Date.now(),
      raw: body
    };

    // 解析仓库信息
    if (body.repository) {
      result.repository = {
        id: body.repository.id,
        name: body.repository.name,
        fullName: body.repository.full_name,
        url: body.repository.html_url,
        private: body.repository.private
      };
    }

    // 解析发送者信息
    if (body.sender) {
      result.sender = {
        id: body.sender.id,
        login: body.sender.login,
        avatar: body.sender.avatar_url,
        url: body.sender.html_url
      };
    }

    // 根据事件类型解析详细信息
    switch (event) {
      case 'push':
        result.data = this._parsePushEvent(body);
        break;
      case 'pull_request':
        result.data = this._parsePullRequestEvent(body);
        break;
      case 'issues':
        result.data = this._parseIssuesEvent(body);
        break;
      case 'issue_comment':
        result.data = this._parseIssueCommentEvent(body);
        break;
      case 'release':
        result.data = this._parseReleaseEvent(body);
        break;
      case 'star':
        result.data = this._parseStarEvent(body);
        break;
      case 'fork':
        result.data = this._parseForkEvent(body);
        break;
      case 'watch':
        result.data = this._parseWatchEvent(body);
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
      created: body.created,
      deleted: body.deleted,
      forced: body.forced,
      compare: body.compare,
      commits: (body.commits || []).map(c => ({
        id: c.id,
        treeId: c.tree_id,
        message: c.message,
        timestamp: c.timestamp,
        author: {
          name: c.author?.name,
          email: c.author?.email,
          username: c.author?.username
        },
        added: c.added || [],
        removed: c.removed || [],
        modified: c.modified || [],
        url: c.url
      })),
      headCommit: body.head_commit ? {
        id: body.head_commit.id,
        message: body.head_commit.message,
        url: body.head_commit.url
      } : null
    };
  }

  _parsePullRequestEvent(body) {
    const pr = body.pull_request;
    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      merged: pr.merged,
      draft: pr.draft,
      locked: pr.locked,
      user: {
        login: pr.user?.login,
        avatar: pr.user?.avatar_url
      },
      head: {
        ref: pr.head?.ref,
        sha: pr.head?.sha
      },
      base: {
        ref: pr.base?.ref,
        sha: pr.base?.sha
      },
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at,
      mergedAt: pr.merged_at,
      url: pr.html_url,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files
    };
  }

  _parseIssuesEvent(body) {
    const issue = body.issue;
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        login: issue.user?.login,
        avatar: issue.user?.avatar_url
      },
      labels: (issue.labels || []).map(l => ({
        name: l.name,
        color: l.color
      })),
      assignees: (issue.assignees || []).map(a => a.login),
      milestone: issue.milestone?.title,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      url: issue.html_url
    };
  }

  _parseIssueCommentEvent(body) {
    return {
      issue: this._parseIssuesEvent(body).data,
      comment: {
        id: body.comment?.id,
        body: body.comment?.body,
        user: {
          login: body.comment?.user?.login,
          avatar: body.comment?.user?.avatar_url
        },
        createdAt: body.comment?.created_at,
        updatedAt: body.comment?.updated_at,
        url: body.comment?.html_url
      }
    };
  }

  _parseReleaseEvent(body) {
    const release = body.release;
    return {
      id: release.id,
      tagName: release.tag_name,
      name: release.name,
      body: release.body,
      draft: release.draft,
      prerelease: release.prerelease,
      createdAt: release.created_at,
      publishedAt: release.published_at,
      url: release.html_url,
      assets: (release.assets || []).map(a => ({
        id: a.id,
        name: a.name,
        size: a.size,
        downloadCount: a.download_count,
        url: a.browser_download_url
      }))
    };
  }

  _parseStarEvent(body) {
    return {
      starredAt: body.starred_at,
      action: body.action // 'created' or 'deleted'
    };
  }

  _parseForkEvent(body) {
    const fork = body.forkee;
    return {
      fork: {
        id: fork.id,
        name: fork.name,
        fullName: fork.full_name,
        owner: fork.owner?.login,
        url: fork.html_url
      }
    };
  }

  _parseWatchEvent(body) {
    return {
      action: 'watched'
    };
  }

  getEventType(event) {
    const actionTypes = {
      push: 'push',
      pull_request: `pr.${event.action}`,
      issues: `issue.${event.action}`,
      issue_comment: `issue_comment.${event.action}`,
      release: `release.${event.action}`,
      star: `star.${event.action}`,
      fork: 'fork.created',
      watch: 'watch'
    };
    return actionTypes[event.event] || event.event;
  }
}

export default GitHubAdapter;